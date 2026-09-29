"""Stripe payment status polling + webhook."""
import os

import stripe
from fastapi import APIRouter, Request, HTTPException

from database import payments_col, orders, now_iso
from order_service import handle_order_paid

router = APIRouter(prefix="/api")
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY") or "sk_test_emergent"
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")


@router.get("/payments/status/{session_id}")
async def payment_status(session_id: str):
    record = await payments_col.find_one({"session_id": session_id}, {"_id": 0})
    if not record:
        raise HTTPException(404, "Transaction not found")
    if record.get("payment_status") != "paid":
        try:
            s = stripe.checkout.Session.retrieve(session_id)
            if s.payment_status == "paid" or s.status == "complete":
                await payments_col.update_one(
                    {"session_id": session_id, "payment_status": {"$ne": "paid"}},
                    {"$set": {"status": "completed", "payment_status": "paid",
                              "stripe_payment_intent_id": s.payment_intent,
                              "updated_at": now_iso()}},
                )
                if record.get("order_number"):
                    await orders.update_one(
                        {"order_number": record["order_number"]},
                        {"$set": {"payment.stripe_payment_intent_id": s.payment_intent}},
                    )
                    await handle_order_paid(record["order_number"])
                record = await payments_col.find_one({"session_id": session_id}, {"_id": 0})
        except stripe.error.StripeError:
            pass
    return {"session_id": record["session_id"], "status": record["status"],
            "payment_status": record["payment_status"],
            "order_number": record.get("order_number")}


@router.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, sig, STRIPE_WEBHOOK_SECRET)
    except Exception:
        raise HTTPException(400, "Invalid signature")
    obj, t = event["data"]["object"], event["type"]
    if t == "checkout.session.completed":
        sid = obj["id"]
        rec = await payments_col.find_one({"session_id": sid})
        await payments_col.update_one(
            {"session_id": sid, "payment_status": {"$ne": "paid"}},
            {"$set": {"status": "completed", "payment_status": "paid",
                      "stripe_payment_intent_id": obj.get("payment_intent"), "updated_at": now_iso()}},
        )
        if rec and rec.get("order_number"):
            await orders.update_one({"order_number": rec["order_number"]},
                                    {"$set": {"payment.stripe_payment_intent_id": obj.get("payment_intent")}})
            await handle_order_paid(rec["order_number"])
    elif t == "charge.refunded":
        await payments_col.update_one({"stripe_payment_intent_id": obj.get("payment_intent")},
                                      {"$set": {"status": "refunded", "payment_status": "refunded", "updated_at": now_iso()}})
    return {"status": "ok"}
