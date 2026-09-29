"""Courier shipping integration (Royal Mail Click & Drop) + manual fallback.

Two legs:
  - INBOUND  (customer -> Sole Serenity): handled via Royal Mail's hosted
    Tracked Returns PORTAL. We simply link the customer to the owner's
    approved portal URL (ROYAL_MAIL_RETURNS_PORTAL_URL); Royal Mail generates
    the customer's label. No API call is needed for this leg.
  - OUTBOUND (Sole Serenity -> customer): created via Click & Drop API
    `POST /orders` with the label returned in-response (base64) + tracking.

Server-side ONLY. Credentials come from environment variables and are NEVER
exposed to the frontend. Falls back to manual label upload when unavailable.

Docs: https://api.parcel.royalmail.com/  (Click & Drop API v1)
"""
import os
import logging

logger = logging.getLogger("soleserenity.shipping")


class CourierNotConfigured(Exception):
    pass


def active_provider() -> str:
    return os.environ.get("SHIPPING_PROVIDER", "manual").lower()


def _rm_base() -> str:
    base = os.environ.get("ROYAL_MAIL_BASE_URL", "https://api.parcel.royalmail.com")
    base = base.rstrip("/")
    if not base.endswith("/api/v1"):
        base = base + "/api/v1"
    return base


def _rm_api_configured() -> bool:
    """True when we can create OUTBOUND labels via the Click & Drop API."""
    return bool(os.environ.get("ROYAL_MAIL_API_KEY")) and bool(os.environ.get("ROYAL_MAIL_SERVICE_CODE"))


def returns_portal_url() -> str:
    """Hosted Tracked Returns portal URL for the INBOUND leg."""
    return os.environ.get("ROYAL_MAIL_RETURNS_PORTAL_URL", "").strip()


def portal_configured() -> bool:
    return bool(returns_portal_url())


def carrier_name() -> str:
    return "Royal Mail" if active_provider() == "royal_mail" else "our courier partner"


def config_status() -> dict:
    """Non-secret status for the admin UI. Never returns actual keys."""
    return {
        "provider": active_provider(),
        "carrier_name": carrier_name(),
        "returns_portal_configured": portal_configured(),
        "returns_portal_url": returns_portal_url(),
        "outbound_api_configured": _rm_api_configured(),
        "trading_name": os.environ.get("ROYAL_MAIL_TRADING_NAME", ""),
        "package_format": os.environ.get("ROYAL_MAIL_PACKAGE_FORMAT", "mediumParcel"),
        "required_env_vars": [
            "ROYAL_MAIL_API_KEY (outbound labels)",
            "ROYAL_MAIL_SERVICE_CODE (outbound service)",
            "ROYAL_MAIL_RETURNS_PORTAL_URL (inbound portal)",
            "ROYAL_MAIL_TRADING_NAME (return address name)",
            "ROYAL_MAIL_PACKAGE_FORMAT (e.g. mediumParcel)",
        ],
        "note": (
            "Inbound uses your hosted Royal Mail Returns Portal link. "
            "Outbound labels are created via the Click & Drop API. "
            "Both fall back to manual label upload if not configured."
        ),
    }


def tracking_url_for(tracking_number, provider=None):
    if not tracking_number:
        return ""
    return f"https://www.royalmail.com/track-your-item#/tracking-results/{tracking_number}"


# --------------------------------------------------------------------------
# INBOUND leg (customer -> us) : hosted Returns Portal
# --------------------------------------------------------------------------
def build_inbound(order: dict) -> dict:
    """Returns the inbound shipment descriptor. Uses the hosted Returns Portal
    when configured; otherwise signals a manual fallback is required."""
    portal = returns_portal_url()
    if portal:
        return {
            "provider": "royal_mail_portal",
            "status": "portal_ready",
            "portal_url": portal,
        }
    raise CourierNotConfigured("Returns Portal URL not configured")


# --------------------------------------------------------------------------
# OUTBOUND leg (us -> customer) : Click & Drop API
# --------------------------------------------------------------------------
def create_outbound_shipment(order: dict) -> dict:
    """Create a Click & Drop order and return label (base64) + tracking."""
    if not _rm_api_configured():
        raise CourierNotConfigured("Royal Mail Click & Drop API not configured")
    import requests
    from datetime import datetime, timezone
    base = _rm_base()
    api_key = os.environ.get("ROYAL_MAIL_API_KEY", "")
    service = os.environ.get("ROYAL_MAIL_SERVICE_CODE", "")
    trading = os.environ.get("ROYAL_MAIL_TRADING_NAME", "Sole Serenity")
    pkg_format = os.environ.get("ROYAL_MAIL_PACKAGE_FORMAT", "mediumParcel")

    cust = order.get("customer", {})
    addr = order.get("return_address", {})
    pairs = max(1, order.get("pricing", {}).get("total_pairs", 1))
    now = datetime.now(timezone.utc).isoformat()

    payload = {"items": [{
        "orderReference": f"{order.get('order_number')}-RET",
        "recipient": {
            "address": {
                "fullName": cust.get("name", ""),
                "addressLine1": addr.get("line1", ""),
                "addressLine2": addr.get("line2", "") or "",
                "city": addr.get("city", ""),
                "county": addr.get("county", "") or "",
                "postcode": addr.get("postcode", ""),
                "countryCode": "GBR",
            },
            "emailAddress": cust.get("email", ""),
            "phoneNumber": cust.get("phone", ""),
        },
        "sender": {"tradingName": trading},
        "orderDate": now,
        "packages": [{"weightInGrams": 1200 * pairs, "packageFormatIdentifier": pkg_format}],
        "postageDetails": {"serviceCode": service},
        "label": {"includeLabelInResponse": True},
    }]}
    headers = {"Authorization": api_key, "Content-Type": "application/json", "Accept": "application/json"}
    resp = requests.post(f"{base}/orders", headers=headers, json=payload, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    created = (data.get("createdOrders") or data.get("items") or [{}])
    order_obj = created[0] if isinstance(created, list) else created
    tracking = order_obj.get("trackingNumber")
    packages = order_obj.get("packages") or []
    if not tracking and packages:
        tracking = packages[0].get("trackingNumber")
    return {
        "shipment_id": str(order_obj.get("orderIdentifier", "")),
        "tracking_number": tracking or "",
        "tracking_url": tracking_url_for(tracking),
        "label_base64": order_obj.get("label", ""),
        "raw": data,
    }


# Backwards-compatible names used by order_service
def create_inbound_shipment(order: dict) -> dict:
    # Inbound is via the portal; raise so callers use the portal descriptor.
    raise CourierNotConfigured("Inbound uses the Returns Portal, not an API label")


def create_return_shipment(order: dict) -> dict:
    return create_outbound_shipment(order)
