"""Email notification service with a safe fallback logging system.

Until a provider (SendGrid/SMTP) is configured via env vars, emails are
persisted to the `email_notifications` collection and logged. When a provider
is configured the same payloads are sent for real.
"""
import os
import uuid
import logging

from database import emails_col, now_iso

logger = logging.getLogger("soleserenity.emails")


def _provider():
    return os.environ.get("EMAIL_PROVIDER", "fallback").lower()


def admin_notify_email():
    """Address that receives internal notifications (new orders / enquiries)."""
    return (os.environ.get("ADMIN_NOTIFY_EMAIL") or "").strip()


def _brand_wrap(subject, inner):
    return f"""<div style=\"background:#0F1214;padding:32px;font-family:Arial,Helvetica,sans-serif;color:#F5F7F8\">
  <div style=\"max-width:560px;margin:0 auto;background:#14181B;border:1px solid #2A3238;border-radius:16px;overflow:hidden\">
    <div style=\"padding:24px 28px;border-bottom:1px solid #2A3238\">
      <span style=\"font-size:22px;font-weight:800;letter-spacing:1px;color:#F5F7F8\">SOLE&nbsp;SERENITY</span>
      <div style=\"color:#2EE6C5;font-size:12px;letter-spacing:2px;margin-top:4px\">CLEAN &bull; PROTECT &bull; RESTORE</div>
    </div>
    <div style=\"padding:28px;line-height:1.6;font-size:15px;color:#D7DDE1\">{inner}</div>
    <div style=\"padding:18px 28px;border-top:1px solid #2A3238;color:#8A949B;font-size:12px\">Sole Serenity &bull; UK-wide tracked delivery</div>
  </div>
</div>"""


EMAIL_TEMPLATES = {
    "order_received": {
        "subject": "Your Sole Serenity order has been received",
        "body": lambda ctx: f"<p>Hi {ctx['name']},</p><p>Thanks \u2014 we\u2019ve received your order <b>{ctx['order_number']}</b> and our specialists are reviewing your photos.</p><p>We\u2019ll email you as soon as your shoes are assessed. You won\u2019t be charged until we approve your order.</p><p><a href=\"{ctx['track_url']}\" style=\"color:#2EE6C5\">Track your order &rarr;</a></p>",
    },
    "order_approved": {
        "subject": "Your Sole Serenity order has been approved",
        "body": lambda ctx: f"<p>Hi {ctx['name']},</p><p>Great news \u2014 order <b>{ctx['order_number']}</b> has been approved! Your total is <b>\u00a3{ctx['total']:.2f}</b> (cleaning + tracked UK delivery).</p><p>Head to your order page to pay securely and receive your prepaid tracked shipping label.</p><p><a href=\"{ctx['track_url']}\" style=\"color:#2EE6C5\">Pay & continue &rarr;</a></p>",
    },
    "payment_required": {
        "subject": "Your Sole Serenity order is ready for payment",
        "body": lambda ctx: f"<p>Hi {ctx['name']},</p><p>Order <b>{ctx['order_number']}</b> is ready for payment. Total due: <b>\u00a3{ctx['total']:.2f}</b>.</p><p><a href=\"{ctx['track_url']}\" style=\"color:#2EE6C5\">Pay securely &rarr;</a></p>",
    },
    "more_photos": {
        "subject": "We need a few more photos for your Sole Serenity order",
        "body": lambda ctx: f"<p>Hi {ctx['name']},</p><p>To assess order <b>{ctx['order_number']}</b> accurately, could you upload a few clearer photos? {ctx.get('note','')}</p><p><a href=\"{ctx['track_url']}\" style=\"color:#2EE6C5\">Upload photos &rarr;</a></p>",
    },
    "declined": {
        "subject": "Update on your Sole Serenity order",
        "body": lambda ctx: f"<p>Hi {ctx['name']},</p><p>After reviewing the photos for order <b>{ctx['order_number']}</b>, unfortunately we\u2019re unable to proceed. {ctx.get('note','')}</p><p>No payment has been taken. If you have questions just reply to this email.</p>",
    },
    "payment_received": {
        "subject": "Payment received \u2014 your shoes are ready to be sent",
        "body": lambda ctx: f"<p>Hi {ctx['name']},</p><p>We\u2019ve received your payment for order <b>{ctx['order_number']}</b>. Thank you!</p><p>Your prepaid tracked shipping label is being prepared \u2014 we\u2019ll send it shortly.</p><p><a href=\"{ctx['track_url']}\" style=\"color:#2EE6C5\">View order &rarr;</a></p>",
    },
    "label_ready": {
        "subject": "Your prepaid tracked shipping label is ready",
        "body": lambda ctx: f"<p>Hi {ctx['name']},</p><p>Your prepaid tracked shipping label for order <b>{ctx['order_number']}</b> is ready. Please package your shoes securely and drop them at any drop-off point.</p><p><a href=\"{ctx['track_url']}\" style=\"color:#2EE6C5\">Download your label &rarr;</a></p><p>Keep your postage receipt until delivery is confirmed.</p>",
    },
    "shoes_received": {
        "subject": "We\u2019ve received your shoes",
        "body": lambda ctx: f"<p>Hi {ctx['name']},</p><p>Your shoes for order <b>{ctx['order_number']}</b> have arrived safely with us. Cleaning is next!</p>",
    },
    "cleaning_started": {
        "subject": "Your shoes are now being cleaned",
        "body": lambda ctx: f"<p>Hi {ctx['name']},</p><p>Good news \u2014 our specialists have started work on order <b>{ctx['order_number']}</b>.</p>",
    },
    "ready_for_return": {
        "subject": "Your shoes are ready to come home",
        "body": lambda ctx: f"<p>Hi {ctx['name']},</p><p>Order <b>{ctx['order_number']}</b> has passed our quality check and is ready to be returned to you.</p>",
    },
    "return_dispatched": {
        "subject": "Your shoes are on their way back",
        "body": lambda ctx: f"<p>Hi {ctx['name']},</p><p>Order <b>{ctx['order_number']}</b> is on its way back to you via a tracked courier.</p><p>Tracking number: <b>{ctx.get('tracking','TBC')}</b></p><p><a href=\"{ctx['track_url']}\" style=\"color:#2EE6C5\">Track your delivery &rarr;</a></p>",
    },
    "delivered": {
        "subject": "Your Sole Serenity order has been delivered",
        "body": lambda ctx: f"<p>Hi {ctx['name']},</p><p>Order <b>{ctx['order_number']}</b> has been delivered. We hope you love the results!</p><p>We\u2019d love a quick review. <a href=\"{ctx['track_url']}\" style=\"color:#2EE6C5\">Leave a review &rarr;</a></p>",
    },
    "refunded": {
        "subject": "Your Sole Serenity refund has been processed",
        "body": lambda ctx: f"<p>Hi {ctx['name']},</p><p>A refund of <b>\u00a3{ctx.get('amount',0):.2f}</b> has been processed for order <b>{ctx['order_number']}</b>.</p>",
    },
}


async def send_email(event, to, ctx):
    """Render + send (or log) an email for the given event."""
    tmpl = EMAIL_TEMPLATES.get(event)
    if not tmpl:
        subject = ctx.get("subject", "Sole Serenity")
        inner = ctx.get("body", "")
    else:
        subject = tmpl["subject"]
        inner = tmpl["body"](ctx)
    html = _brand_wrap(subject, inner)
    text = _html_to_text(inner)
    provider = _provider()
    record = {
        "id": str(uuid.uuid4()),
        "event": event,
        "to": to,
        "subject": subject,
        "body_html": html,
        "order_number": ctx.get("order_number"),
        "provider": provider,
        "status": "logged",
        "created_at": now_iso(),
    }
    sent = False
    try:
        if provider == "mailgun" and os.environ.get("MAILGUN_API_KEY") and os.environ.get("MAILGUN_DOMAIN"):
            sent = _send_mailgun(to, subject, html, text)
        elif provider == "sendgrid" and os.environ.get("SENDGRID_API_KEY"):
            sent = _send_sendgrid(to, subject, html, text)
        elif provider == "smtp" and os.environ.get("SMTP_HOST"):
            sent = _send_smtp(to, subject, html, text)
    except Exception as e:  # never break the flow on email errors
        logger.error(f"Email send failed ({provider}): {e}")
        record["error"] = str(e)
    record["status"] = "sent" if sent else "logged"
    await emails_col.insert_one(dict(record))
    logger.info(f"[EMAIL:{record['status']}] event={event} to={to} order={ctx.get('order_number')} subj='{subject}'")
    return record["id"]


def _html_to_text(inner_html):
    import re
    txt = re.sub(r"(?is)<br\s*/?>", "\n", inner_html or "")
    txt = re.sub(r"(?is)</p>", "\n\n", txt)
    txt = re.sub(r"(?is)<[^>]+>", "", txt)
    txt = txt.replace("&rarr;", "->").replace("&amp;", "&").replace("&pound;", "\u00a3")
    txt = re.sub(r"\n{3,}", "\n\n", txt).strip()
    return f"{txt}\n\n\u2014 Sole Serenity\nClean \u2022 Protect \u2022 Restore" if txt else "Sole Serenity"


def _build_message(to, subject, html, text):
    """Build a standards-compliant multipart/alternative message with the
    headers that inbox providers expect (reduces junk classification)."""
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    from email.utils import formatdate, make_msgid, formataddr
    frm = os.environ.get("EMAIL_FROM", os.environ.get("SMTP_USER", "no-reply@soleserenity.co.uk"))
    from_domain = frm.split("@")[-1] if "@" in frm else "soleserenity.co.uk"
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = formataddr(("Sole Serenity", frm))
    msg["To"] = to
    msg["Reply-To"] = frm
    msg["Date"] = formatdate(localtime=True)
    msg["Message-ID"] = make_msgid(domain=from_domain)
    msg["List-Unsubscribe"] = f"<mailto:{frm}?subject=unsubscribe>"
    msg["Auto-Submitted"] = "auto-generated"
    msg["X-Mailer"] = "Sole Serenity"
    # text part first, html second (clients prefer the last/richest part)
    msg.attach(MIMEText(text or " ", "plain", "utf-8"))
    msg.attach(MIMEText(html, "html", "utf-8"))
    return frm, msg


def _send_mailgun(to, subject, html, text=""):
    import requests
    api_key = os.environ["MAILGUN_API_KEY"]
    domain = os.environ.get("MAILGUN_DOMAIN", "")
    base = os.environ.get("MAILGUN_BASE_URL", "https://api.mailgun.net").rstrip("/")
    frm = os.environ.get("EMAIL_FROM", f"postmaster@{domain}")
    resp = requests.post(
        f"{base}/v3/{domain}/messages",
        auth=("api", api_key),
        data={
            "from": f"Sole Serenity <{frm}>",
            "to": to,
            "subject": subject,
            "text": text or " ",
            "html": html,
            "h:Reply-To": frm,
        }, timeout=20,
    )
    if resp.status_code not in (200, 201, 202):
        raise RuntimeError(f"Mailgun {resp.status_code}: {resp.text[:200]}")
    return True


def _send_sendgrid(to, subject, html, text=""):
    import requests
    key = os.environ["SENDGRID_API_KEY"]
    frm = os.environ.get("EMAIL_FROM", "no-reply@soleserenity.co.uk")
    resp = requests.post(
        "https://api.sendgrid.com/v3/mail/send",
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        json={
            "personalizations": [{"to": [{"email": to}]}],
            "from": {"email": frm, "name": "Sole Serenity"},
            "reply_to": {"email": frm, "name": "Sole Serenity"},
            "subject": subject,
            "content": [
                {"type": "text/plain", "value": text or " "},
                {"type": "text/html", "value": html},
            ],
        }, timeout=15,
    )
    return resp.status_code in (200, 201, 202)


def _send_smtp(to, subject, html, text=""):
    import smtplib
    host = os.environ["SMTP_HOST"]
    port = int(os.environ.get("SMTP_PORT", "587"))
    user = os.environ.get("SMTP_USER")
    pwd = os.environ.get("SMTP_PASSWORD")
    frm, msg = _build_message(to, subject, html, text)
    with smtplib.SMTP(host, port, timeout=20) as s:
        s.ehlo()
        s.starttls()
        s.ehlo()
        if user:
            s.login(user, pwd)
        s.sendmail(frm, [to], msg.as_string())
    return True
