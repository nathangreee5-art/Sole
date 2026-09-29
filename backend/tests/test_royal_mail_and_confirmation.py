"""Backend tests for iteration 5: Royal Mail inbound/outbound labels + booking confirmation data + regression on order/checkout."""
import os
import io
import time
import pytest
import requests

BASE_URL = (os.environ.get("BACKEND_URL") or "https://sole-build.preview.emergentagent.com").rstrip("/") + "/api"
ADMIN_EMAIL = "admin@soleserenity.co.uk"
ADMIN_PASSWORD = "SoleAdmin2025!"
RETURNS_PORTAL_URL = "https://return.royalmail.com/cf633480-a662-4047-99e3-6ff1d5985a03"


# ---------- fixtures ----------
@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{BASE_URL}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    assert r.status_code == 200, r.text
    tok = r.json().get("token") or r.json().get("access_token")
    assert tok
    return tok


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


def _upload_photo(slot):
    # tiny valid PNG (1x1)
    png = bytes.fromhex("89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C489"
                       "0000000A49444154789C6300010000000500010D0A2DB40000000049454E44AE426082")
    files = [("files", (f"{slot}.png", io.BytesIO(png), "image/png"))]
    r = requests.post(f"{BASE_URL}/uploads", files=files, timeout=30)
    assert r.status_code == 200, r.text
    d = r.json()["files"][0]
    return {"file_id": d["file_id"], "slot": slot, "filename": d.get("filename", f"{slot}.png"), "content_type": "image/png"}


@pytest.fixture(scope="module")
def new_order():
    photos = [_upload_photo(s) for s in ("front", "left", "right", "back", "soles")]
    payload = {
        "customer_name": "Iter5 Tester",
        "email": "iter5@example.com",
        "phone": "07123456789",
        "billing_address": {"line1": "1 Test St", "city": "London", "postcode": "SW1A 1AA", "country": "United Kingdom"},
        "return_address": {"line1": "1 Test St", "city": "London", "postcode": "SW1A 1AA", "country": "United Kingdom"},
        "items": [{"pair_index": 0, "service": "quick", "brand": "Nike", "size": "9"}],
        "photos": photos,
        "special_instructions": "",
        "origin_url": "https://sole-build.preview.emergentagent.com",
    }
    r = requests.post(f"{BASE_URL}/orders", json=payload, timeout=30)
    assert r.status_code == 200, r.text
    return r.json()["order"]


# ---------- Regression: order create + access token ----------
class TestOrderCreation:
    def test_order_created_sequential_pending(self, new_order):
        assert new_order["order_number"].startswith("SS-")
        assert int(new_order["order_number"].split("-")[1]) >= 10001
        assert new_order["status"] == "PENDING_ASSESSMENT"
        assert new_order.get("access_token")
        assert len(new_order["access_token"]) >= 16

    def test_get_order_with_token(self, new_order):
        r = requests.get(f"{BASE_URL}/orders/{new_order['order_number']}", params={"token": new_order["access_token"]}, timeout=30)
        assert r.status_code == 200
        assert r.json()["order"]["order_number"] == new_order["order_number"]

    def test_get_order_wrong_token(self, new_order):
        r = requests.get(f"{BASE_URL}/orders/{new_order['order_number']}", params={"token": "wrong"}, timeout=30)
        assert r.status_code == 403

    def test_checkout_blocked_before_approval(self, new_order):
        r = requests.post(f"{BASE_URL}/orders/{new_order['order_number']}/checkout",
                          json={"token": new_order["access_token"], "origin_url": "https://sole-build.preview.emergentagent.com"},
                          timeout=30)
        assert r.status_code == 400


# ---------- Admin settings expose Royal Mail ----------
class TestAdminSettings:
    def test_royal_mail_settings(self, admin_headers):
        r = requests.get(f"{BASE_URL}/admin/settings", headers=admin_headers, timeout=30)
        assert r.status_code == 200, r.text
        s = r.json()
        rm = s.get("royal_mail", {})
        assert rm.get("provider") == "royal_mail", rm
        assert rm.get("returns_portal_configured") is True
        assert rm.get("outbound_api_configured") is True
        assert rm.get("returns_portal_url") == RETURNS_PORTAL_URL
        assert s.get("test_mode") is True


# ---------- Approval + Checkout + Labels ----------
class TestOrderLifecycleAndLabels:
    def test_approve_and_checkout(self, admin_headers, new_order):
        on = new_order["order_number"]
        r = requests.post(f"{BASE_URL}/admin/orders/{on}/approve", headers=admin_headers, json={"note": "ok"}, timeout=30)
        assert r.status_code == 200, r.text
        assert r.json()["order"]["status"] == "APPROVED"

        r = requests.post(f"{BASE_URL}/orders/{on}/checkout",
                          json={"token": new_order["access_token"], "origin_url": "https://sole-build.preview.emergentagent.com"},
                          timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("checkout_url", "").startswith("https://")
        assert "stripe.com" in d["checkout_url"]
        assert d.get("session_id")

        # payment status endpoint
        r2 = requests.get(f"{BASE_URL}/payments/status/{d['session_id']}", timeout=30)
        assert r2.status_code == 200, r2.text

    def test_generate_inbound_label_portal(self, admin_headers, new_order):
        on = new_order["order_number"]
        r = requests.post(f"{BASE_URL}/admin/orders/{on}/label/generate",
                          headers=admin_headers, json={"type": "inbound"}, timeout=30)
        assert r.status_code == 200, r.text
        o = r.json()["order"]
        inbound = o.get("shipment", {}).get("inbound", {})
        # provider is 'royal_mail_portal' per shipping.build_inbound
        assert "portal" in (inbound.get("provider") or "").lower() or inbound.get("provider") == "royal_mail_portal"
        assert inbound.get("portal_url") == RETURNS_PORTAL_URL
        assert o["status"] == "LABEL_GENERATED"

        # verify label_ready email logged
        r2 = requests.get(f"{BASE_URL}/admin/emails", headers=admin_headers, timeout=30)
        assert r2.status_code == 200
        emails = r2.json().get("emails", [])
        matching = [e for e in emails if e.get("order_number") == on and e.get("event") == "label_ready"]
        assert len(matching) >= 1, "label_ready email not logged"

    def test_outbound_label_test_mode(self, admin_headers, new_order):
        on = new_order["order_number"]
        # Drive to READY_FOR_RETURN
        r = requests.post(f"{BASE_URL}/admin/orders/{on}/status",
                          headers=admin_headers, json={"status": "READY_FOR_RETURN", "note": "ready"}, timeout=30)
        assert r.status_code == 200, r.text

        r = requests.post(f"{BASE_URL}/admin/orders/{on}/label/generate",
                          headers=admin_headers, json={"type": "return"}, timeout=30)
        assert r.status_code == 200, r.text
        o = r.json()["order"]
        ret = o.get("shipment", {}).get("return", {})
        assert ret.get("provider") == "test", ret
        assert (ret.get("tracking_number") or "").startswith("TEST"), ret
        assert ret.get("status") == "generated"
        assert o["status"] == "RETURN_LABEL_GENERATED"

        r2 = requests.get(f"{BASE_URL}/admin/emails", headers=admin_headers, timeout=30)
        emails = r2.json().get("emails", [])
        matching = [e for e in emails if e.get("order_number") == on and e.get("event") == "return_dispatched"]
        assert len(matching) >= 1, "return_dispatched email not logged"
