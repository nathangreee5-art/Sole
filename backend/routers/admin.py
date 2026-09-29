"""Admin routes: dashboard, order management, settings, content management."""
import os
import uuid
from io import BytesIO
from typing import Optional, List

import stripe
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from pydantic import BaseModel, Field

from database import (
    orders, settings_col, faq_col, gallery_col, reviews_col, contact_col,
    payments_col, tickets_col, fs_bucket, now_iso, ORDER_STATUSES, STATUS_LABELS,
)
from auth import get_current_admin
from seed import get_settings
import shipping
import tickets
from order_service import (
    serialize_order, set_status, email_for_event,
    generate_inbound_label, generate_return_label, track_url,
)

router = APIRouter(prefix="/api/admin", dependencies=[Depends(get_current_admin)])


# ---------------- Dashboard ----------------
@router.get("/dashboard")
async def dashboard():
    all_orders = await orders.find({}, {"_id": 0}).to_list(5000)
    by_status = {}
    revenue = 0.0
    pairs = 0
    for o in all_orders:
        st = o.get("status")
        by_status[st] = by_status.get(st, 0) + 1
        if o.get("payment", {}).get("status") == "PAID":
            revenue += float(o.get("pricing", {}).get("grand_total", 0)) - float(o.get("payment", {}).get("refunded_amount", 0))
            pairs += int(o.get("pricing", {}).get("total_pairs", 0))
    recent = sorted(all_orders, key=lambda x: x.get("created_at", ""), reverse=True)[:8]
    return {
        "counts": {
            "total_orders": len(all_orders),
            "pending_assessment": by_status.get("PENDING_ASSESSMENT", 0),
            "awaiting_customer": by_status.get("AWAITING_CUSTOMER_INFORMATION", 0),
            "awaiting_payment": by_status.get("AWAITING_PAYMENT", 0) + by_status.get("APPROVED", 0),
            "shoes_in_transit": by_status.get("SHOES_IN_TRANSIT", 0) + by_status.get("AWAITING_SHOES", 0),
            "shoes_received": by_status.get("SHOES_RECEIVED", 0),
            "cleaning": by_status.get("CLEANING", 0) + by_status.get("QUALITY_CHECK", 0),
            "ready_for_return": by_status.get("READY_FOR_RETURN", 0),
            "returns_in_transit": by_status.get("RETURN_IN_TRANSIT", 0) + by_status.get("RETURN_LABEL_GENERATED", 0),
            "completed": by_status.get("COMPLETED", 0) + by_status.get("DELIVERED", 0),
        },
        "by_status": by_status,
        "revenue": round(revenue, 2),
        "pairs_cleaned": pairs,
        "recent_orders": [serialize_order(o) for o in recent],
        "statuses": ORDER_STATUSES,
        "status_labels": STATUS_LABELS,
    }


@router.get("/orders")
async def list_orders(status: Optional[str] = None, search: Optional[str] = None):
    q = {}
    if status and status != "ALL":
        q["status"] = status
    docs = await orders.find(q, {"_id": 0}).sort("created_at", -1).to_list(2000)
    if search:
        s = search.lower()
        docs = [d for d in docs if s in d.get("order_number", "").lower()
                or s in d.get("customer", {}).get("name", "").lower()
                or s in d.get("customer", {}).get("email", "").lower()]
    return {"orders": [serialize_order(o) for o in docs]}


@router.get("/orders/{order_number}")
async def get_order_admin(order_number: str):
    o = await orders.find_one({"order_number": order_number})
    if not o:
        raise HTTPException(404, "Order not found")
    return {"order": serialize_order(o)}


@router.delete("/orders/{order_number}")
async def delete_order(order_number: str):
    from bson import ObjectId
    o = await orders.find_one({"order_number": order_number})
    if not o:
        raise HTTPException(404, "Order not found")
    # remove associated GridFS files (photos + any stored labels)
    file_ids = [p.get("file_id") for p in o.get("photos", []) if p.get("file_id")]
    for leg in ("inbound", "return"):
        fid = o.get("shipment", {}).get(leg, {}).get("label_file_id")
        if fid:
            file_ids.append(fid)
    for fid in file_ids:
        try:
            await fs_bucket.delete(ObjectId(fid))
        except Exception:
            pass
    await orders.delete_one({"order_number": order_number})
    await payments_col.delete_many({"order_number": order_number})
    return {"ok": True, "deleted": order_number}


class NoteRequest(BaseModel):
    note: Optional[str] = ""


@router.post("/orders/{order_number}/approve")
async def approve(order_number: str, req: NoteRequest):
    o = await orders.find_one({"order_number": order_number})
    if not o:
        raise HTTPException(404, "Order not found")
    o = await set_status(order_number, "APPROVED", req.note or "Approved by admin")
    await email_for_event(o, "order_approved")
    await email_for_event(o, "payment_required")
    return {"order": serialize_order(o)}


@router.post("/orders/{order_number}/decline")
async def decline(order_number: str, req: NoteRequest):
    o = await set_status(order_number, "CANCELLED", req.note or "Declined by admin")
    if not o:
        raise HTTPException(404, "Order not found")
    await email_for_event(o, "declined", note=req.note or "")
    return {"order": serialize_order(o)}


@router.post("/orders/{order_number}/request-photos")
async def request_photos(order_number: str, req: NoteRequest):
    o = await set_status(order_number, "AWAITING_CUSTOMER_INFORMATION", req.note or "More photos requested")
    if not o:
        raise HTTPException(404, "Order not found")
    await email_for_event(o, "more_photos", note=req.note or "")
    return {"order": serialize_order(o)}


class StatusRequest(BaseModel):
    status: str
    note: Optional[str] = ""


# status -> customer email event to fire automatically
STATUS_EMAIL_MAP = {
    "SHOES_RECEIVED": "shoes_received",
    "CLEANING": "cleaning_started",
    "READY_FOR_RETURN": "ready_for_return",
    "DELIVERED": "delivered",
}


@router.post("/orders/{order_number}/status")
async def change_status(order_number: str, req: StatusRequest):
    if req.status not in ORDER_STATUSES:
        raise HTTPException(400, "Invalid status")
    o = await set_status(order_number, req.status, req.note or f"Status set to {req.status}")
    if not o:
        raise HTTPException(404, "Order not found")
    event = STATUS_EMAIL_MAP.get(req.status)
    if event:
        await email_for_event(o, event)
    if req.status in ("RETURN_IN_TRANSIT", "RETURN_LABEL_GENERATED"):
        tracking = o.get("shipment", {}).get("return", {}).get("tracking_number", "TBC")
        await email_for_event(o, "return_dispatched", tracking=tracking)
    return {"order": serialize_order(o)}


class PriceRequest(BaseModel):
    cleaning_total: Optional[float] = None
    shipping_total: Optional[float] = None
    grand_total: Optional[float] = None


@router.post("/orders/{order_number}/price")
async def override_price(order_number: str, req: PriceRequest):
    o = await orders.find_one({"order_number": order_number})
    if not o:
        raise HTTPException(404, "Order not found")
    pricing = o.get("pricing", {})
    if req.cleaning_total is not None:
        pricing["cleaning_total"] = round(req.cleaning_total, 2)
    if req.shipping_total is not None:
        pricing["shipping_total"] = round(req.shipping_total, 2)
    if req.grand_total is not None:
        pricing["grand_total"] = round(req.grand_total, 2)
    else:
        pricing["grand_total"] = round(pricing.get("cleaning_total", 0) + pricing.get("shipping_total", 0), 2)
    payment = o.get("payment", {})
    payment["amount"] = pricing["grand_total"]
    await orders.update_one({"order_number": order_number},
                            {"$set": {"pricing": pricing, "payment": payment, "updated_at": now_iso()}})
    updated = await orders.find_one({"order_number": order_number})
    return {"order": serialize_order(updated)}


# ---------------- Shipping labels ----------------
class LabelTypeRequest(BaseModel):
    type: str = "inbound"  # inbound | return


@router.post("/orders/{order_number}/label/generate")
async def generate_label(order_number: str, req: LabelTypeRequest):
    o = await orders.find_one({"order_number": order_number})
    if not o:
        raise HTTPException(404, "Order not found")
    shipment = o.get("shipment", {})
    if req.type == "return":
        ret, ok = await generate_return_label(o)
        shipment["return"] = ret
        await orders.update_one({"order_number": order_number}, {"$set": {"shipment": shipment}})
        if ok:
            o = await set_status(order_number, "RETURN_LABEL_GENERATED", "Return label generated")
            await email_for_event(o, "return_dispatched", tracking=ret.get("tracking_number", "TBC"))
        else:
            raise HTTPException(400, "Royal Mail API not configured. Upload a label manually instead.")
    else:
        inbound, ok = await generate_inbound_label(o)
        shipment["inbound"] = inbound
        await orders.update_one({"order_number": order_number}, {"$set": {"shipment": shipment}})
        if ok:
            o = await set_status(order_number, "LABEL_GENERATED", "Inbound label generated")
            await email_for_event(o, "label_ready")
        else:
            raise HTTPException(400, "Royal Mail API not configured. Upload a label manually instead.")
    updated = await orders.find_one({"order_number": order_number})
    return {"order": serialize_order(updated)}


@router.post("/orders/{order_number}/label/manual")
async def upload_manual_label(
    order_number: str,
    type: str = Form("inbound"),
    tracking_number: str = Form(""),
    tracking_url: str = Form(""),
    file: Optional[UploadFile] = File(None),
):
    o = await orders.find_one({"order_number": order_number})
    if not o:
        raise HTTPException(404, "Order not found")
    shipment = o.get("shipment", {})
    leg = shipment.get(type, {}) or {}
    leg["provider"] = "manual"
    leg["tracking_number"] = tracking_number
    leg["tracking_url"] = tracking_url or shipping.tracking_url_for(tracking_number)
    leg["status"] = "generated"
    leg["created_at"] = now_iso()
    if file is not None:
        data = await file.read()
        if len(data) > 15 * 1024 * 1024:
            raise HTTPException(400, "Label file too large (max 15MB).")
        ct = (file.content_type or "application/pdf").lower()
        fid = await fs_bucket.upload_from_stream(
            file.filename or f"{order_number}-{type}-label.pdf", BytesIO(data),
            metadata={"content_type": ct, "uploaded_at": now_iso()},
        )
        leg["label_file_id"] = str(fid)
    shipment[type] = leg
    await orders.update_one({"order_number": order_number}, {"$set": {"shipment": shipment, "updated_at": now_iso()}})
    if type == "inbound":
        o = await set_status(order_number, "LABEL_GENERATED", "Manual inbound label uploaded")
        o = await set_status(order_number, "AWAITING_SHOES", "Awaiting customer to post shoes")
        await email_for_event(o, "label_ready")
    else:
        o = await set_status(order_number, "RETURN_LABEL_GENERATED", "Manual return label uploaded")
        await email_for_event(o, "return_dispatched", tracking=tracking_number or "TBC")
    updated = await orders.find_one({"order_number": order_number})
    return {"order": serialize_order(updated)}


# ---------------- Refunds ----------------
class RefundRequest(BaseModel):
    amount: Optional[float] = None  # None = full refund


@router.post("/orders/{order_number}/refund")
async def refund(order_number: str, req: RefundRequest):
    o = await orders.find_one({"order_number": order_number})
    if not o:
        raise HTTPException(404, "Order not found")
    pi = o.get("payment", {}).get("stripe_payment_intent_id")
    if not pi:
        raise HTTPException(400, "No payment found to refund.")
    stripe.api_key = os.environ.get("STRIPE_SECRET_KEY") or "sk_test_emergent"
    try:
        if req.amount:
            stripe.Refund.create(payment_intent=pi, amount=int(round(req.amount * 100)))
        else:
            stripe.Refund.create(payment_intent=pi)
    except Exception as e:
        raise HTTPException(500, f"Refund failed: {e}")
    payment = o.get("payment", {})
    total = float(o.get("pricing", {}).get("grand_total", 0))
    refunded = float(payment.get("refunded_amount", 0)) + (req.amount if req.amount else total)
    payment["refunded_amount"] = round(min(refunded, total), 2)
    payment["status"] = "REFUNDED" if payment["refunded_amount"] >= total else "PARTIALLY_REFUNDED"
    await orders.update_one({"order_number": order_number},
                            {"$set": {"payment": payment, "updated_at": now_iso()}})
    new_status = "REFUNDED" if payment["status"] == "REFUNDED" else o.get("status")
    o = await set_status(order_number, new_status, f"Refund processed: \u00a3{req.amount if req.amount else total:.2f}")
    await email_for_event(o, "refunded", amount=(req.amount if req.amount else total))
    updated = await orders.find_one({"order_number": order_number})
    return {"order": serialize_order(updated)}


class ContactCustomerRequest(BaseModel):
    subject: str
    message: str


@router.post("/orders/{order_number}/contact")
async def contact_customer(order_number: str, req: ContactCustomerRequest):
    """Start (or continue) a ticket conversation with the customer about an
    order. Sends the message by email and keeps the thread in the admin portal."""
    o = await orders.find_one({"order_number": order_number})
    if not o:
        raise HTTPException(404, "Order not found")
    cust = o.get("customer", {})
    # reuse an existing open ticket for this order if there is one
    existing = await tickets_col.find_one({"order_number": order_number, "status": "open"})
    if existing:
        ticket, _ = await tickets.add_message(existing, "admin", req.message.strip())
    else:
        ticket = await tickets.create_ticket(
            subject=req.subject or f"Order {order_number}",
            name=cust.get("name", "Customer"),
            email=cust.get("email", ""),
            body=req.message.strip(),
            sender="admin",
            order_number=order_number,
            origin_url=o.get("origin_url", ""),
        )
    await tickets.email_customer_reply(ticket, req.message.strip())
    return {"ok": True, "ticket_id": ticket["id"]}


# ---------------- Tickets / conversations ----------------
class TicketReply(BaseModel):
    body: str = Field(min_length=1)


class TicketStatus(BaseModel):
    status: str


@router.get("/tickets")
async def list_tickets(status: Optional[str] = None):
    q = {}
    if status in ("open", "closed"):
        q["status"] = status
    items = await tickets_col.find(q, {"_id": 0}).sort("updated_at", -1).to_list(500)
    out = []
    for t in items:
        msgs = t.get("messages", [])
        out.append({
            "id": t["id"],
            "subject": t.get("subject"),
            "status": t.get("status"),
            "customer": t.get("customer"),
            "order_number": t.get("order_number"),
            "unread_admin": t.get("unread_admin", False),
            "last_sender": t.get("last_sender"),
            "message_count": len(msgs),
            "last_message": (msgs[-1]["body"][:140] if msgs else ""),
            "updated_at": t.get("updated_at"),
            "created_at": t.get("created_at"),
        })
    unread = sum(1 for t in items if t.get("unread_admin"))
    return {"tickets": out, "unread": unread}


@router.get("/tickets/unread-count")
async def tickets_unread_count():
    n = await tickets_col.count_documents({"unread_admin": True})
    return {"unread": n}


@router.get("/tickets/{ticket_id}")
async def get_ticket(ticket_id: str):
    t = await tickets_col.find_one({"id": ticket_id})
    if not t:
        raise HTTPException(404, "Ticket not found")
    await tickets.mark_read(ticket_id)
    t["unread_admin"] = False
    return {"ticket": tickets.serialize(t)}


@router.post("/tickets/{ticket_id}/reply")
async def reply_ticket(ticket_id: str, req: TicketReply):
    t = await tickets_col.find_one({"id": ticket_id})
    if not t:
        raise HTTPException(404, "Ticket not found")
    t, _ = await tickets.add_message(t, "admin", req.body.strip())
    await tickets.mark_read(ticket_id)
    t["unread_admin"] = False
    await tickets.email_customer_reply(t, req.body.strip())
    return {"ticket": tickets.serialize(t)}


@router.post("/tickets/{ticket_id}/status")
async def update_ticket_status(ticket_id: str, req: TicketStatus):
    if req.status not in ("open", "closed"):
        raise HTTPException(400, "Invalid status")
    t = await tickets_col.find_one({"id": ticket_id})
    if not t:
        raise HTTPException(404, "Ticket not found")
    await tickets.set_status(ticket_id, req.status)
    t = await tickets_col.find_one({"id": ticket_id})
    return {"ticket": tickets.serialize(t)}


@router.delete("/tickets/{ticket_id}")
async def delete_ticket(ticket_id: str):
    await tickets_col.delete_one({"id": ticket_id})
    return {"ok": True, "deleted": ticket_id}


# ---------------- Settings ----------------
@router.get("/settings")
async def admin_get_settings():
    s = await get_settings()
    s["royal_mail"] = shipping.config_status()
    s["stripe_mode"] = os.environ.get("STRIPE_MODE", "test")
    s["email_provider"] = os.environ.get("EMAIL_PROVIDER", "fallback")
    return s


class SettingsUpdate(BaseModel):
    business: Optional[dict] = None
    pricing: Optional[dict] = None
    shipping_rates: Optional[List[dict]] = None
    social: Optional[dict] = None
    analytics: Optional[dict] = None
    announcement: Optional[str] = None
    maintenance_mode: Optional[bool] = None
    test_mode: Optional[bool] = None


@router.put("/settings")
async def admin_update_settings(req: SettingsUpdate):
    update = {k: v for k, v in req.model_dump().items() if v is not None}
    update["updated_at"] = now_iso()
    await settings_col.update_one({"_id": "app_settings"}, {"$set": update}, upsert=True)
    return await get_settings()


# ---------------- FAQ management ----------------
class FaqItem(BaseModel):
    q: str
    a: str
    order: Optional[int] = 999


@router.post("/faq")
async def add_faq(req: FaqItem):
    doc = {"id": str(uuid.uuid4()), **req.model_dump()}
    await faq_col.insert_one(dict(doc))
    return doc


@router.put("/faq/{item_id}")
async def update_faq(item_id: str, req: FaqItem):
    await faq_col.update_one({"id": item_id}, {"$set": req.model_dump()})
    return await faq_col.find_one({"id": item_id}, {"_id": 0})


@router.delete("/faq/{item_id}")
async def delete_faq(item_id: str):
    await faq_col.delete_one({"id": item_id})
    return {"ok": True}


# ---------------- Gallery management ----------------
class GalleryItem(BaseModel):
    before_file_id: Optional[str] = ""
    after_file_id: Optional[str] = ""
    shoe_type: str = ""
    description: Optional[str] = ""
    order: Optional[int] = 999


@router.post("/gallery")
async def add_gallery(req: GalleryItem):
    doc = {"id": str(uuid.uuid4()), "created_at": now_iso(), **req.model_dump()}
    await gallery_col.insert_one(dict(doc))
    if doc.get("before_file_id"):
        doc["before_url"] = f"/api/images/{doc['before_file_id']}"
    if doc.get("after_file_id"):
        doc["after_url"] = f"/api/images/{doc['after_file_id']}"
    return doc


@router.delete("/gallery/{item_id}")
async def delete_gallery(item_id: str):
    await gallery_col.delete_one({"id": item_id})
    return {"ok": True}


# ---------------- Reviews management ----------------
class ReviewItem(BaseModel):
    name: str
    location: Optional[str] = ""
    rating: int = 5
    text: str
    approved: bool = True
    order: Optional[int] = 999


@router.get("/reviews")
async def admin_reviews():
    items = await reviews_col.find({}, {"_id": 0}).sort("order", 1).to_list(500)
    return items


@router.post("/reviews")
async def add_review(req: ReviewItem):
    doc = {"id": str(uuid.uuid4()), "created_at": now_iso(), **req.model_dump()}
    await reviews_col.insert_one(dict(doc))
    return doc


@router.put("/reviews/{item_id}")
async def update_review(item_id: str, req: ReviewItem):
    await reviews_col.update_one({"id": item_id}, {"$set": req.model_dump()})
    return await reviews_col.find_one({"id": item_id}, {"_id": 0})


@router.delete("/reviews/{item_id}")
async def delete_review(item_id: str):
    await reviews_col.delete_one({"id": item_id})
    return {"ok": True}


# ---------------- Messages / emails log ----------------
@router.get("/messages")
async def messages():
    items = await contact_col.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"messages": items}


@router.get("/emails")
async def emails_log():
    from database import emails_col
    items = await emails_col.find({}, {"_id": 0, "body_html": 0}).sort("created_at", -1).to_list(200)
    return {"emails": items}
