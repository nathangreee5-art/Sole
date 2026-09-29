"""Public routes: auth, content (services/faq/gallery/reviews/settings), uploads, images, pricing calc, contact."""
import uuid
from io import BytesIO
from typing import List, Optional

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId

from database import (
    fs_bucket, faq_col, gallery_col, reviews_col, settings_col, users_col,
    tickets_col, now_iso,
)
from pricing import calculate_order
from seed import get_settings
from auth import hash_password, verify_password, create_token, get_optional_user
import tickets

router = APIRouter(prefix="/api")

ALLOWED_IMAGE_TYPES = {"image/png", "image/jpeg", "image/jpg", "image/webp", "image/heic", "image/heif"}
MAX_FILE_BYTES = 12 * 1024 * 1024  # 12 MB


# ---------------- Services / content ----------------
SERVICES = [
    {
        "key": "quick", "name": "Quick Clean", "price": 15.0,
        "tagline": "A crisp, standard refresh",
        "includes": ["Exterior clean", "Midsole clean", "Basic sole clean", "Laces cleaned", "Basic finishing & detailing"],
        "best_for": "Shoes needing a standard clean-up",
    },
    {
        "key": "deep", "name": "Deep Clean", "price": 20.0,
        "tagline": "Our most intensive treatment",
        "includes": ["Full exterior clean", "Deep midsole clean", "Detailed sole clean", "Laces cleaned", "Detailed finishing", "Intensive stain & dirt treatment", "Extra attention to heavily soiled areas"],
        "best_for": "Heavily soiled or well-worn shoes",
    },
]


@router.get("/services")
async def get_services():
    s = await get_settings()
    pricing = s.get("pricing", {})
    return {
        "services": SERVICES,
        "pricing": pricing,
        "shipping_rates": s.get("shipping_rates", []),
        "disclaimer": "Results vary depending on material, age, staining and condition. We can\u2019t promise every stain or mark will be completely removed \u2014 that\u2019s why we assess your photos first.",
    }


@router.get("/settings/public")
async def public_settings():
    s = await get_settings()
    return {
        "business": s.get("business", {}),
        "social": s.get("social", {}),
        "analytics": s.get("analytics", {}),
        "announcement": s.get("announcement", ""),
        "maintenance_mode": s.get("maintenance_mode", False),
        "shipping_rates": s.get("shipping_rates", []),
        "pricing": s.get("pricing", {}),
    }


@router.get("/faq")
async def get_faq():
    items = await faq_col.find({}, {"_id": 0}).sort("order", 1).to_list(200)
    return items


@router.get("/gallery")
async def get_gallery():
    items = await gallery_col.find({}, {"_id": 0}).sort("order", 1).to_list(200)
    for it in items:
        if it.get("before_file_id"):
            it["before_url"] = f"/api/images/{it['before_file_id']}"
        if it.get("after_file_id"):
            it["after_url"] = f"/api/images/{it['after_file_id']}"
    return items


@router.get("/reviews")
async def get_reviews():
    items = await reviews_col.find({"approved": True}, {"_id": 0}).sort("order", 1).to_list(200)
    return items


# ---------------- Pricing calculator ----------------
class CalcItem(BaseModel):
    service: str = "quick"


class CalcRequest(BaseModel):
    items: List[CalcItem]


@router.post("/pricing/calculate")
async def pricing_calculate(req: CalcRequest):
    s = await get_settings()
    items = [{"service": i.service} for i in req.items]
    if not items:
        return {"cleaning_total": 0, "shipping_total": 0, "grand_total": 0, "total_pairs": 0}
    return calculate_order(items, s.get("pricing", {}), s.get("shipping_rates", []))


# ---------------- Uploads / images ----------------
@router.post("/uploads")
async def upload_images(files: List[UploadFile] = File(...)):
    if not files:
        raise HTTPException(400, "No files provided")
    if len(files) > 12:
        raise HTTPException(400, "Too many files (max 12 per request)")
    out = []
    for f in files:
        ct = (f.content_type or "").lower()
        if ct not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(400, f"Unsupported file type: {ct}. Please upload JPG, PNG, WEBP or HEIC.")
        data = await f.read()
        if len(data) > MAX_FILE_BYTES:
            raise HTTPException(400, f"{f.filename} is too large (max 12MB).")
        if len(data) == 0:
            raise HTTPException(400, f"{f.filename} is empty.")
        fid = await fs_bucket.upload_from_stream(
            f.filename or "upload", BytesIO(data),
            metadata={"content_type": ct, "uploaded_at": now_iso()},
        )
        out.append({"file_id": str(fid), "filename": f.filename, "content_type": ct})
    return {"files": out}


@router.get("/images/{file_id}")
async def get_image(file_id: str):
    try:
        oid = ObjectId(file_id)
    except Exception:
        raise HTTPException(404, "Not found")
    try:
        stream = await fs_bucket.open_download_stream(oid)
    except Exception:
        raise HTTPException(404, "Image not found")
    data = await stream.read()
    ct = (stream.metadata or {}).get("content_type", "image/jpeg")
    return StreamingResponse(BytesIO(data), media_type=ct,
                             headers={"Cache-Control": "public, max-age=86400"})


@router.get("/labels/{file_id}")
async def get_label(file_id: str):
    try:
        oid = ObjectId(file_id)
    except Exception:
        raise HTTPException(404, "Not found")
    try:
        stream = await fs_bucket.open_download_stream(oid)
    except Exception:
        raise HTTPException(404, "Label not found")
    data = await stream.read()
    ct = (stream.metadata or {}).get("content_type", "application/pdf")
    fname = stream.filename or "label.pdf"
    return StreamingResponse(BytesIO(data), media_type=ct,
                             headers={"Content-Disposition": f"inline; filename={fname}"})


# ---------------- Contact ----------------
class ContactRequest(BaseModel):
    name: str
    email: EmailStr
    message: str
    subject: Optional[str] = "Website enquiry"
    origin_url: Optional[str] = ""


@router.post("/contact")
async def contact(req: ContactRequest):
    ticket = await tickets.create_ticket(
        subject=req.subject or "Website enquiry",
        name=req.name,
        email=req.email,
        body=req.message,
        sender="customer",
        origin_url=req.origin_url or "",
    )
    await tickets.notify_admin(ticket, is_new=True)
    await tickets.email_customer_receipt(ticket)
    return {
        "ok": True,
        "message": "Thanks! We\u2019ll be in touch shortly.",
        "ticket_id": ticket["id"],
        "token": ticket["token"],
    }


# ---------------- Customer conversation (ticket) ----------------
class ConversationReply(BaseModel):
    token: str
    body: str = Field(min_length=1)


async def _get_ticket_by_token(ticket_id: str, token: str):
    t = await tickets_col.find_one({"id": ticket_id})
    if not t or not token or token != t.get("token"):
        raise HTTPException(404, "Conversation not found.")
    return t


@router.get("/conversations/{ticket_id}")
async def get_conversation(ticket_id: str, token: str):
    t = await _get_ticket_by_token(ticket_id, token)
    return {"ticket": tickets.serialize(t, customer_view=True)}


@router.post("/conversations/{ticket_id}/messages")
async def add_conversation_message(ticket_id: str, req: ConversationReply):
    t = await _get_ticket_by_token(ticket_id, req.token)
    t, _ = await tickets.add_message(t, "customer", req.body.strip())
    await tickets.notify_admin(t, is_new=False)
    return {"ticket": tickets.serialize(t, customer_view=True)}


# ---------------- Auth (optional customer accounts) ----------------
class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/auth/register")
async def register(req: RegisterRequest):
    email = req.email.lower()
    if await users_col.find_one({"email": email}):
        raise HTTPException(400, "An account with this email already exists.")
    user = {
        "id": str(uuid.uuid4()), "email": email, "name": req.name,
        "password": hash_password(req.password), "role": "customer", "created_at": now_iso(),
    }
    await users_col.insert_one(dict(user))
    token = create_token(user)
    return {"token": token, "user": {"id": user["id"], "email": email, "name": req.name, "role": "customer"}}


@router.post("/auth/login")
async def login(req: LoginRequest):
    email = req.email.lower()
    user = await users_col.find_one({"email": email})
    if not user or not verify_password(req.password, user.get("password", "")):
        raise HTTPException(401, "Invalid email or password.")
    token = create_token(user)
    return {"token": token, "user": {"id": user["id"], "email": user["email"], "name": user["name"], "role": user.get("role", "customer")}}


@router.get("/auth/me")
async def me(user=Depends(get_optional_user)):
    if not user:
        raise HTTPException(401, "Not authenticated")
    return user
