"""Customer order routes: create, fetch (guest+account), add photos, checkout."""
import os
import uuid
from typing import List, Optional

import stripe
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr, Field

from database import orders, next_order_number, now_iso, PAYABLE_STATUSES, payments_col
from pricing import calculate_order
from seed import get_settings
from auth import get_optional_user
from order_service import serialize_order, set_status, email_for_event, track_url, notify_admin_new_order

router = APIRouter(prefix="/api")
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY") or "sk_test_emergent"


# ---------------- Schemas ----------------
class Address(BaseModel):
    line1: str
    line2: Optional[str] = ""
    city: str
    county: Optional[str] = ""
    postcode: str
    country: str = "United Kingdom"


class PhotoRef(BaseModel):
    file_id: str
    slot: str = "other"
    pair_index: Optional[int] = None
    filename: Optional[str] = ""
    content_type: Optional[str] = ""


class OrderItem(BaseModel):
    pair_index: int
    service: str = "quick"
    brand: Optional[str] = ""
    model: Optional[str] = ""
    material: Optional[str] = ""
    color: Optional[str] = ""
    size: Optional[str] = ""
    condition: Optional[str] = ""
    notes: Optional[str] = ""


class CreateOrderRequest(BaseModel):
    customer_name: str = Field(min_length=2)
    email: EmailStr
    phone: str = Field(min_length=6)
    billing_address: Address
    return_address: Address
    items: List[OrderItem]
    photos: List[PhotoRef] = []
    special_instructions: Optional[str] = ""
    origin_url: Optional[str] = ""


UK_POSTCODE_MIN = 5


def _validate_uk_address(addr: Address, label: str):
    pc = (addr.postcode or "").strip()
    if len(pc.replace(" ", "")) < UK_POSTCODE_MIN:
        raise HTTPException(400, f"Please enter a valid UK postcode for the {label} address.")
    if not addr.line1.strip() or not addr.city.strip():
        raise HTTPException(400, f"Please complete the {label} address (street and town/city).")


@router.post("/orders")
async def create_order(req: CreateOrderRequest, user=Depends(get_optional_user)):
    if not req.items:
        raise HTTPException(400, "Please add at least one pair.")
    if len(req.items) > 4:
        raise HTTPException(400, "You can send up to 4 pairs per order.")
    for it in req.items:
        if it.service not in ("quick", "deep"):
            raise HTTPException(400, "Invalid service selected.")
    _validate_uk_address(req.billing_address, "billing")
    _validate_uk_address(req.return_address, "return")
    if len(req.photos) < 1:
        raise HTTPException(400, "Please upload at least one photo of your shoes.")

    s = await get_settings()
    pricing = calculate_order([{"service": i.service} for i in req.items],
                              s.get("pricing", {}), s.get("shipping_rates", []))
    order_number = await next_order_number()
    doc = {
        "id": str(uuid.uuid4()),
        "order_number": order_number,
        "access_token": uuid.uuid4().hex,
        "user_id": user["id"] if user else None,
        "customer": {"name": req.customer_name, "email": req.email.lower(), "phone": req.phone},
        "billing_address": req.billing_address.model_dump(),
        "return_address": req.return_address.model_dump(),
        "items": [i.model_dump() for i in req.items],
        "photos": [p.model_dump() for p in req.photos],
        "special_instructions": req.special_instructions,
        "pricing": pricing,
        "status": "PENDING_ASSESSMENT",
        "payment": {"status": "UNPAID", "amount": pricing["grand_total"], "currency": "gbp",
                     "refunded_amount": 0.0},
        "shipment": {"inbound": {}, "return": {}},
        "status_history": [{"status": "PENDING_ASSESSMENT", "at": now_iso(), "note": "Order submitted"}],
        "origin_url": (req.origin_url or "").rstrip("/"),
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    await orders.insert_one(dict(doc))
    await email_for_event(doc, "order_received")
    await notify_admin_new_order(doc)
    return {"order": serialize_order(doc, include_token=True)}


async def _get_order_authorized(order_number, token, user):
    order = await orders.find_one({"order_number": order_number})
    if not order:
        raise HTTPException(404, "Order not found")
    if user and user.get("role") == "admin":
        return order
    if user and order.get("user_id") == user.get("id"):
        return order
    if token and token == order.get("access_token"):
        return order
    raise HTTPException(403, "You don\u2019t have access to this order.")


@router.get("/orders/{order_number}")
async def get_order(order_number: str, token: Optional[str] = None, user=Depends(get_optional_user)):
    order = await _get_order_authorized(order_number, token, user)
    include_token = bool(token and token == order.get("access_token"))
    return {"order": serialize_order(order, include_token=include_token)}


class AddPhotosRequest(BaseModel):
    token: Optional[str] = None
    photos: List[PhotoRef]


@router.post("/orders/{order_number}/photos")
async def add_photos(order_number: str, req: AddPhotosRequest, user=Depends(get_optional_user)):
    order = await _get_order_authorized(order_number, req.token, user)
    if not req.photos:
        raise HTTPException(400, "No photos provided.")
    photos = order.get("photos", []) + [p.model_dump() for p in req.photos]
    await orders.update_one({"order_number": order_number},
                            {"$set": {"photos": photos, "updated_at": now_iso()}})
    # if we were awaiting info, move back to pending assessment
    if order.get("status") == "AWAITING_CUSTOMER_INFORMATION":
        await set_status(order_number, "PENDING_ASSESSMENT", "Customer uploaded more photos")
    updated = await orders.find_one({"order_number": order_number})
    return {"order": serialize_order(updated, include_token=bool(req.token))}


@router.get("/my/orders")
async def my_orders(user=Depends(get_optional_user)):
    if not user:
        raise HTTPException(401, "Not authenticated")
    docs = await orders.find({"user_id": user["id"]}).sort("created_at", -1).to_list(200)
    return {"orders": [serialize_order(d) for d in docs]}


# ---------------- Checkout ----------------
class CheckoutRequest(BaseModel):
    token: Optional[str] = None
    origin_url: str


@router.post("/orders/{order_number}/checkout")
async def checkout(order_number: str, req: CheckoutRequest, user=Depends(get_optional_user)):
    order = await _get_order_authorized(order_number, req.token, user)
    if order.get("status") not in PAYABLE_STATUSES:
        raise HTTPException(400, "This order isn\u2019t ready for payment yet. It must be approved first.")
    amount = float(order.get("pricing", {}).get("grand_total", 0))
    if amount <= 0:
        raise HTTPException(400, "Invalid order amount.")
    amount_pence = int(round(amount * 100))
    origin = req.origin_url.rstrip("/")
    try:
        session = stripe.checkout.Session.create(
            mode="payment",
            line_items=[{
                "price_data": {
                    "currency": "gbp",
                    "unit_amount": amount_pence,
                    "product_data": {"name": f"Sole Serenity Cleaning \u2014 {order_number}"},
                },
                "quantity": 1,
            }],
            success_url=f"{origin}/payment/success?session_id={{CHECKOUT_SESSION_ID}}&order={order_number}",
            cancel_url=f"{origin}/order/{order_number}?token={order.get('access_token','')}",
            metadata={"order_number": order_number, "kind": "cleaning"},
        )
    except Exception as e:
        raise HTTPException(500, f"Could not start checkout: {e}")

    await payments_col.insert_one({
        "session_id": session.id, "order_number": order_number, "amount": amount,
        "currency": "gbp", "status": "initiated", "payment_status": "pending",
        "created_at": now_iso(), "updated_at": now_iso(),
    })
    payment = order.get("payment", {})
    payment["status"] = "PAYMENT_PENDING"
    payment["session_id"] = session.id
    await orders.update_one({"order_number": order_number},
                            {"$set": {"payment": payment, "updated_at": now_iso()}})
    await set_status(order_number, "AWAITING_PAYMENT", "Checkout started")
    return {"checkout_url": session.url, "session_id": session.id}
