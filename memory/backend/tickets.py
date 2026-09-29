"""Ticket / conversation system.

Two-way messaging between the business (via admin portal) and customers.
Customers reply through a tokenised web link; every message is stored on the
ticket and mirrored by an email notification. No inbound email parsing is
required — the whole conversation lives on the site.
"""
import os
import uuid

from database import tickets_col, now_iso
from emails import send_email, admin_notify_email


def _base(ticket):
    return (ticket.get("origin_url") or os.environ.get("PUBLIC_BASE_URL", "")).rstrip("/")


def customer_url(ticket):
    base = _base(ticket)
    return f"{base}/conversation/{ticket['id']}?token={ticket['token']}" if base else ""


def admin_url(ticket):
    base = _base(ticket)
    return f"{base}/admin/tickets/{ticket['id']}" if base else ""


def serialize(ticket, customer_view=False):
    if not ticket:
        return ticket
    o = dict(ticket)
    o.pop("_id", None)
    if customer_view:
        o.pop("token", None)
        o.pop("unread_admin", None)
        o.pop("origin_url", None)
    return o


async def create_ticket(*, subject, name, email, body, sender="customer",
                        order_number=None, origin_url=""):
    now = now_iso()
    ticket = {
        "id": str(uuid.uuid4()),
        "token": uuid.uuid4().hex,
        "subject": (subject or "Enquiry").strip(),
        "status": "open",
        "customer": {"name": (name or "Customer").strip(), "email": (email or "").strip().lower()},
        "order_number": order_number,
        "origin_url": (origin_url or "").rstrip("/"),
        "messages": [{"id": str(uuid.uuid4()), "sender": sender, "body": body, "created_at": now}],
        "last_sender": sender,
        "unread_admin": sender == "customer",
        "created_at": now,
        "updated_at": now,
    }
    await tickets_col.insert_one(dict(ticket))
    return ticket


async def add_message(ticket, sender, body):
    msg = {"id": str(uuid.uuid4()), "sender": sender, "body": body, "created_at": now_iso()}
    messages = ticket.get("messages", []) + [msg]
    updates = {
        "messages": messages,
        "last_sender": sender,
        "updated_at": now_iso(),
        "status": "open",
    }
    if sender == "customer":
        updates["unread_admin"] = True
    await tickets_col.update_one({"id": ticket["id"]}, {"$set": updates})
    ticket.update(updates)
    return ticket, msg


async def mark_read(ticket_id):
    await tickets_col.update_one({"id": ticket_id}, {"$set": {"unread_admin": False}})


async def set_status(ticket_id, status):
    await tickets_col.update_one({"id": ticket_id}, {"$set": {"status": status, "updated_at": now_iso()}})


# ---------------- Email side-effects ----------------
async def notify_admin(ticket, is_new=False):
    to = admin_notify_email()
    if not to:
        return
    link = admin_url(ticket)
    last = ticket["messages"][-1]["body"]
    intro = "A new enquiry has been submitted" if is_new else "A customer replied to a conversation"
    ordline = f"<br><b>Order:</b> {ticket['order_number']}" if ticket.get("order_number") else ""
    cta = (f"<p><a href=\"{link}\" style=\"color:#3b82f6\">Open in admin to reply &rarr;</a></p>"
           if link else "<p>Log in to the admin portal to reply.</p>")
    body = (
        f"<p>{intro}.</p>"
        f"<p><b>From:</b> {ticket['customer']['name']} ({ticket['customer']['email']})<br>"
        f"<b>Subject:</b> {ticket['subject']}{ordline}</p>"
        f"<p><b>Message</b></p><p>{last}</p>{cta}"
    )
    await send_email("generic", to, {
        "subject": f"[Ticket] {ticket['subject']}",
        "body": body,
        "order_number": ticket.get("order_number"),
    })


async def email_customer_reply(ticket, message_body):
    to = ticket["customer"]["email"]
    if not to:
        return
    link = customer_url(ticket)
    cta = (f"<p><a href=\"{link}\" style=\"color:#3b82f6\">View &amp; reply &rarr;</a></p>"
           if link else "")
    body = (
        f"<p>Hi {ticket['customer']['name']},</p>"
        f"<p>You have a new reply from the Sole Serenity team regarding "
        f"\u201c{ticket['subject']}\u201d:</p>"
        f"<div style=\"border-left:3px solid #3b82f6;padding:4px 0 4px 14px;color:#D7DDE1\">{message_body}</div>"
        f"{cta}"
        f"<p style=\"color:#8A949B\">You can reply on that page and the conversation will "
        f"continue here \u2014 no need to email us back.</p>"
    )
    await send_email("generic", to, {
        "subject": f"Re: {ticket['subject']} \u2014 Sole Serenity",
        "body": body,
        "order_number": ticket.get("order_number"),
    })


async def email_customer_receipt(ticket):
    """Acknowledge a newly-created enquiry to the customer with a link."""
    to = ticket["customer"]["email"]
    if not to:
        return
    link = customer_url(ticket)
    cta = (f"<p><a href=\"{link}\" style=\"color:#3b82f6\">View your message &rarr;</a></p>"
           if link else "")
    body = (
        f"<p>Hi {ticket['customer']['name']},</p>"
        f"<p>Thanks for getting in touch \u2014 we\u2019ve received your message and the team "
        f"will reply shortly. You\u2019ll get an email when we respond, and you can follow the "
        f"whole conversation here:</p>{cta}"
    )
    await send_email("generic", to, {
        "subject": f"We\u2019ve received your message \u2014 Sole Serenity",
        "body": body,
        "order_number": ticket.get("order_number"),
    })
