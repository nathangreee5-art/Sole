"""Shared order side-effects: serialization, status changes, emails, labels."""
import os
import base64
import logging

from database import orders, fs_bucket, now_iso, STATUS_LABELS
from emails import send_email
import shipping

logger = logging.getLogger("soleserenity.orders")


def public_base():
    return os.environ.get("PUBLIC_BASE_URL", "").rstrip("/")


def track_url(order):
    base = order.get("origin_url") or public_base()
    return f"{base}/order/{order['order_number']}?token={order.get('access_token','')}"


def _email_ctx(order, **extra):
    ctx = {
        "name": order.get("customer", {}).get("name", "there"),
        "order_number": order["order_number"],
        "total": order.get("pricing", {}).get("grand_total", 0.0),
        "track_url": track_url(order),
    }
    ctx.update(extra)
    return ctx


def serialize_order(order, include_token=False):
    if not order:
        return order
    o = dict(order)
    o.pop("_id", None)
    if not include_token:
        o.pop("access_token", None)
    # attach image urls
    for p in o.get("photos", []):
        p["url"] = f"/api/images/{p['file_id']}"
    inbound = o.get("shipment", {}).get("inbound", {})
    if inbound.get("label_file_id"):
        inbound["label_url"] = f"/api/labels/{inbound['label_file_id']}"
    ret = o.get("shipment", {}).get("return", {})
    if ret.get("label_file_id"):
        ret["label_url"] = f"/api/labels/{ret['label_file_id']}"
    o["status_label"] = STATUS_LABELS.get(o.get("status"), o.get("status"))
    return o


async def set_status(order_number, new_status, note=None):
    order = await orders.find_one({"order_number": order_number})
    if not order:
        return None
    history = order.get("status_history", [])
    history.append({"status": new_status, "at": now_iso(), "note": note})
    await orders.update_one(
        {"order_number": order_number},
        {"$set": {"status": new_status, "status_history": history, "updated_at": now_iso()}},
    )
    return await orders.find_one({"order_number": order_number})


async def email_for_event(order, event, **extra):
    to = order.get("customer", {}).get("email")
    if not to:
        return
    await send_email(event, to, _email_ctx(order, **extra))


async def notify_admin_new_order(order):
    """Send an internal notification to the business inbox when a new order
    is submitted, so the owner knows to log in and assess it."""
    from emails import admin_notify_email
    to = admin_notify_email()
    if not to:
        return
    c = order.get("customer", {})
    items = order.get("items", [])
    pricing = order.get("pricing", {})
    base = order.get("origin_url") or public_base()
    admin_url = f"{base}/admin/login" if base else ""
    rows = ""
    for i, it in enumerate(items):
        svc = f"{(it.get('service') or 'quick').title()} Clean"
        shoe = " ".join(x for x in [it.get("brand", ""), it.get("model", "")] if x).strip()
        rows += f"<li>Pair {i + 1}: {svc}" + (f" &mdash; {shoe}" if shoe else "") + "</li>"
    cta = (f"<p><a href=\"{admin_url}\" style=\"color:#3b82f6\">Open admin to review &rarr;</a></p>"
           if admin_url else "")
    body = (
        f"<p>A new order has been submitted and needs your assessment.</p>"
        f"<p><b>Order:</b> {order['order_number']}<br>"
        f"<b>Customer:</b> {c.get('name', '')}<br>"
        f"<b>Email:</b> {c.get('email', '')}<br>"
        f"<b>Phone:</b> {c.get('phone', '')}</p>"
        f"<p><b>Pairs</b></p><ul>{rows}</ul>"
        f"<p><b>Estimated total:</b> \u00a3{float(pricing.get('grand_total', 0)):.2f}</p>"
        f"{cta}"
    )
    await send_email("generic", to, {
        "subject": f"New order {order['order_number']} \u2014 needs assessment",
        "body": body,
        "order_number": order["order_number"],
    })


async def generate_inbound_label(order):
    """Inbound leg: use the Royal Mail hosted Returns Portal link when
    configured; otherwise flag manual-required (admin uploads a label)."""
    inbound = order.get("shipment", {}).get("inbound", {})
    try:
        res = shipping.build_inbound(order)
        inbound.update({**res, "created_at": now_iso()})
        return inbound, True
    except shipping.CourierNotConfigured:
        inbound.update({"provider": "manual", "status": "manual_required", "created_at": now_iso()})
        return inbound, False
    except Exception as e:
        logger.error(f"Inbound setup error: {e}")
        inbound.update({"provider": "manual", "status": "manual_required",
                        "error": str(e), "created_at": now_iso()})
        return inbound, False


async def generate_return_label(order):
    """Outbound leg (us -> customer): create a Click & Drop label via API,
    store the returned PDF in GridFS, and record tracking.
    In TEST MODE, produce a simulated label so the flow can be walked
    end-to-end without creating a real Royal Mail order or incurring charges."""
    ret = order.get("shipment", {}).get("return", {})
    from seed import get_settings
    settings = await get_settings()
    if settings.get("test_mode"):
        ret.update({
            "provider": "test",
            "test": True,
            "shipment_id": f"TEST-{order.get('order_number')}",
            "tracking_number": f"TEST{order.get('order_number', '').replace('SS-', '')}",
            "tracking_url": "",
            "status": "generated",
            "created_at": now_iso(),
        })
        return ret, True
    try:
        res = shipping.create_return_shipment(order)
        ret.update({
            "provider": "royal_mail",
            "shipment_id": res["shipment_id"],
            "tracking_number": res["tracking_number"],
            "tracking_url": res["tracking_url"],
            "status": "generated",
            "created_at": now_iso(),
        })
        b64 = res.get("label_base64")
        if b64:
            try:
                pdf = base64.b64decode(b64)
                from io import BytesIO
                fid = await fs_bucket.upload_from_stream(
                    f"{order.get('order_number')}-return-label.pdf", BytesIO(pdf),
                    metadata={"content_type": "application/pdf", "uploaded_at": now_iso()},
                )
                ret["label_file_id"] = str(fid)
            except Exception as e:
                logger.error(f"Label store error: {e}")
        return ret, True
    except shipping.CourierNotConfigured:
        ret.update({"provider": "manual", "status": "manual_required", "created_at": now_iso()})
        return ret, False
    except Exception as e:
        logger.error(f"Royal Mail return error: {e}")
        ret.update({"provider": "manual", "status": "manual_required",
                    "error": str(e), "created_at": now_iso()})
        return ret, False


async def handle_order_paid(order_number):
    """Idempotent: mark order paid, email, and attempt inbound label."""
    order = await orders.find_one({"order_number": order_number})
    if not order:
        return None
    if order.get("payment", {}).get("status") == "PAID":
        return order  # already handled
    payment = order.get("payment", {})
    payment["status"] = "PAID"
    payment["paid_at"] = now_iso()
    await orders.update_one({"order_number": order_number},
                            {"$set": {"payment": payment, "updated_at": now_iso()}})
    order = await set_status(order_number, "PAID", "Payment received")
    await email_for_event(order, "payment_received")

    # Attempt inbound label
    inbound, ok = await generate_inbound_label(order)
    shipment = order.get("shipment", {})
    shipment["inbound"] = inbound
    await orders.update_one({"order_number": order_number},
                            {"$set": {"shipment": shipment, "updated_at": now_iso()}})
    if ok:
        order = await set_status(order_number, "LABEL_GENERATED", "Inbound label generated")
        order = await set_status(order_number, "AWAITING_SHOES", "Awaiting customer to post shoes")
        await email_for_event(order, "label_ready")
    return await orders.find_one({"order_number": order_number})
