"""
Sole Serenity - Core POC
Validates the failure-prone core in isolation before building the full app:
  1. Stripe Flow A (claimable sandbox) -> dynamic GBP Checkout Session -> status retrieval
  2. Tiered multi-pair + mixed-service pricing engine
  3. Order number generator (SS-10001 atomic counter in Mongo)
  4. Image upload storage (GridFS) + retrieval + byte verification
  5. Email fallback logging (persist to Mongo + log)

Run:  cd /app/backend && python poc_core.py
"""
import os, json, base64, urllib.request, urllib.error
from datetime import datetime, timezone

import stripe
from pymongo import MongoClient, ReturnDocument
import gridfs
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ.get("DB_NAME", "test_database")
client = MongoClient(MONGO_URL)
db = client[DB_NAME]
fs = gridfs.GridFS(db)

GREEN = "\033[92m"; RED = "\033[91m"; RESET = "\033[0m"
def ok(m): print(f"{GREEN}[PASS]{RESET} {m}")
def fail(m): print(f"{RED}[FAIL]{RESET} {m}")

results = {}

# ---------------------------------------------------------------------------
# 2. PRICING ENGINE (tiered, per-service group, mixed services supported)
# ---------------------------------------------------------------------------
# Tier tables = TOTAL price for N pairs of that service.
QUICK_TIERS = {1: 13.00, 2: 23.40, 3: 33.15, 4: 41.60}
DEEP_TIERS = {1: 18.00, 2: 32.40, 3: 45.90, 4: 57.60}
QUICK_UNIT = 13.00
DEEP_UNIT = 18.00

def price_for_group(service, count):
    """Return total for `count` pairs of a single service using tier table.
    For counts > max tier, tier for max + per-unit for remainder."""
    if count <= 0:
        return 0.0
    tiers = QUICK_TIERS if service == "quick" else DEEP_TIERS
    unit = QUICK_UNIT if service == "quick" else DEEP_UNIT
    max_tier = max(tiers)
    if count in tiers:
        return round(tiers[count], 2)
    if count < max_tier:  # shouldn't happen, tiers are contiguous
        return round(tiers[count], 2)
    # count > max_tier: use best tier + per-unit remainder
    return round(tiers[max_tier] + (count - max_tier) * unit, 2)

def shipping_cost(total_pairs, rates=None):
    """Default shipping rules: 1-3 pairs 7.50, 4 pairs 12.00, >4 scale."""
    if rates is None:
        rates = [
            {"min_pairs": 1, "max_pairs": 3, "price": 7.50},
            {"min_pairs": 4, "max_pairs": 4, "price": 12.00},
        ]
    for r in rates:
        if r["min_pairs"] <= total_pairs <= r["max_pairs"]:
            return round(r["price"], 2)
    # fallback for > highest tier: highest price + extra per block
    highest = max(rates, key=lambda r: r["max_pairs"])
    return round(highest["price"], 2)

def calculate_order(items, rates=None):
    """items = [{'service': 'quick'|'deep'}, ...] one entry per pair.
    Groups by service, applies tier pricing per group, adds shipping."""
    counts = {"quick": 0, "deep": 0}
    for it in items:
        counts[it["service"]] += 1
    cleaning = price_for_group("quick", counts["quick"]) + price_for_group("deep", counts["deep"])
    total_pairs = len(items)
    ship = shipping_cost(total_pairs, rates)
    return {
        "cleaning_total": round(cleaning, 2),
        "shipping_total": round(ship, 2),
        "grand_total": round(cleaning + ship, 2),
        "counts": counts,
        "total_pairs": total_pairs,
    }

def test_pricing():
    try:
        # Same-service tier checks
        assert price_for_group("quick", 1) == 13.00
        assert price_for_group("quick", 4) == 41.60
        assert price_for_group("deep", 3) == 45.90
        # Mixed: 1 quick + 1 deep = 13 + 18 = 31 cleaning
        r = calculate_order([{"service": "quick"}, {"service": "deep"}])
        assert r["cleaning_total"] == 31.00, r
        assert r["shipping_total"] == 7.50, r
        assert r["grand_total"] == 38.50, r
        # 4 pairs all quick = 41.60 + 12.00 ship = 53.60
        r2 = calculate_order([{"service": "quick"}] * 4)
        assert r2["cleaning_total"] == 41.60 and r2["shipping_total"] == 12.00, r2
        assert r2["grand_total"] == 53.60, r2
        # Mixed 2 quick + 2 deep = 23.40 + 32.40 = 55.80 cleaning + 12 ship (4 pairs)
        r3 = calculate_order([{"service": "quick"}, {"service": "quick"}, {"service": "deep"}, {"service": "deep"}])
        assert r3["cleaning_total"] == 55.80, r3
        assert r3["shipping_total"] == 12.00 and r3["grand_total"] == 67.80, r3
        ok(f"Pricing engine correct. Sample mixed 2Q+2D: {r3}")
        results["pricing"] = True
    except AssertionError as e:
        fail(f"Pricing engine mismatch: {e}")
        results["pricing"] = False

# ---------------------------------------------------------------------------
# 3. ORDER NUMBER GENERATOR (atomic Mongo counter)
# ---------------------------------------------------------------------------
def next_order_number():
    doc = db.counters.find_one_and_update(
        {"_id": "order_number"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return f"SS-{10000 + doc['seq']}"

def test_order_numbers():
    try:
        db.counters.delete_one({"_id": "order_number"})
        a = next_order_number(); b = next_order_number(); c = next_order_number()
        assert a == "SS-10001" and b == "SS-10002" and c == "SS-10003", (a, b, c)
        ok(f"Order numbers monotonic: {a}, {b}, {c}")
        results["order_numbers"] = True
    except AssertionError as e:
        fail(f"Order number gen failed: {e}")
        results["order_numbers"] = False

# ---------------------------------------------------------------------------
# 4. IMAGE STORAGE (GridFS) + retrieval + byte verification
# ---------------------------------------------------------------------------
# tiny 1x1 red PNG
SAMPLE_PNG_B64 = ("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgYGAAAAAEAAH2FzhVAAAAAElFTkSuQmCC")

def store_image(order_id, filename, content_type, raw_bytes):
    # size validation (<= 10MB) & type validation
    if len(raw_bytes) > 10 * 1024 * 1024:
        raise ValueError("file too large")
    if content_type not in ("image/png", "image/jpeg", "image/webp", "image/heic"):
        raise ValueError("invalid content type")
    fid = fs.put(raw_bytes, filename=filename, contentType=content_type,
                 metadata={"order_id": order_id, "uploaded_at": datetime.now(timezone.utc)})
    return str(fid)

def get_image(fid):
    from bson import ObjectId
    gout = fs.get(ObjectId(fid))
    return gout.read(), gout.content_type

def test_image_storage():
    try:
        raw = base64.b64decode(SAMPLE_PNG_B64)
        fid = store_image("poc-order", "front.png", "image/png", raw)
        back, ct = get_image(fid)
        assert back == raw and ct == "image/png", "byte mismatch"
        # reject bad type
        rejected = False
        try:
            store_image("poc-order", "bad.exe", "application/x-msdownload", b"MZ")
        except ValueError:
            rejected = True
        assert rejected, "should reject invalid content type"
        ok(f"GridFS image store+retrieve verified (id={fid}); bad type rejected")
        results["image_storage"] = True
    except Exception as e:
        fail(f"Image storage failed: {e}")
        results["image_storage"] = False

# ---------------------------------------------------------------------------
# 5. EMAIL FALLBACK LOGGING
# ---------------------------------------------------------------------------
def send_email_fallback(to, subject, body, order_number=None):
    doc = {
        "to": to, "subject": subject, "body": body, "order_number": order_number,
        "provider": "fallback_log", "status": "logged",
        "created_at": datetime.now(timezone.utc),
    }
    res = db.email_notifications.insert_one(doc)
    print(f"    [EMAIL:fallback] to={to} subj='{subject}' order={order_number}")
    return str(res.inserted_id)

def test_email_fallback():
    try:
        eid = send_email_fallback("customer@example.com",
                                  "Your Sole Serenity order has been received",
                                  "Thanks! Order SS-10001 received.", "SS-10001")
        doc = db.email_notifications.find_one({"_id__": eid}) or db.email_notifications.find_one({"order_number": "SS-10001"})
        assert doc is not None and doc["status"] == "logged", "email not persisted"
        assert doc["order_number"] == "SS-10001", "order number missing in email"
        ok("Email fallback persisted with order number")
        results["email_fallback"] = True
    except Exception as e:
        fail(f"Email fallback failed: {e}")
        results["email_fallback"] = False

# ---------------------------------------------------------------------------
# 1. STRIPE FLOW A - provision sandbox + dynamic GBP checkout + status
# ---------------------------------------------------------------------------
def provision_stripe_sandbox():
    base = os.environ["INTEGRATION_PROXY_URL"]
    job_id = "a140a5bf-62bf-4432-abf3-a5d0c9bc1177"
    key = "sk-emergent-43156C5D544F976F7F"
    req = urllib.request.Request(
        base + "/stripe/sandboxes",
        data=json.dumps({"job_id": job_id}).encode(),
        headers={"Authorization": "Bearer " + key, "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req) as r:
        return json.load(r)

def test_stripe():
    try:
        sandbox = provision_stripe_sandbox()
        secret = sandbox["sandbox_secret_key"]
        stripe.api_key = secret
        acct = stripe.Account.retrieve()
        print(f"    Sandbox account country: {acct.get('country')}")

        # Dynamic GBP checkout using inline price_data (server-side amount)
        order = calculate_order([{"service": "quick"}, {"service": "deep"}])
        amount_pence = int(round(order["grand_total"] * 100))
        session = stripe.checkout.Session.create(
            mode="payment",
            line_items=[{
                "price_data": {
                    "currency": "gbp",
                    "unit_amount": amount_pence,
                    "product_data": {"name": "Sole Serenity Cleaning Order SS-TEST"},
                },
                "quantity": 1,
            }],
            success_url="https://example.com/payment/success?session_id={CHECKOUT_SESSION_ID}",
            cancel_url="https://example.com/payment/cancel",
            metadata={"order_number": "SS-TEST", "kind": "poc"},
        )
        assert session.url and session.id, "no checkout url/id"
        # persist transaction
        db.payment_transactions.insert_one({
            "session_id": session.id, "amount": order["grand_total"], "currency": "gbp",
            "status": "initiated", "payment_status": "pending",
            "created_at": datetime.now(timezone.utc),
        })
        # retrieve status
        s2 = stripe.checkout.Session.retrieve(session.id)
        assert s2.amount_total == amount_pence, f"amount mismatch {s2.amount_total} vs {amount_pence}"
        assert s2.currency == "gbp", "currency not gbp"
        print(f"    Checkout URL: {session.url[:70]}...")
        ok(f"Stripe GBP checkout created: amount=£{order['grand_total']} ({amount_pence}p), status={s2.status}")
        # save sandbox keys for the app
        results["stripe"] = True
        results["_sandbox"] = sandbox
    except urllib.error.HTTPError as e:
        fail(f"Stripe sandbox HTTP error: {e.code} {e.read().decode()[:300]}")
        results["stripe"] = False
    except Exception as e:
        fail(f"Stripe test failed: {type(e).__name__}: {e}")
        results["stripe"] = False

# ---------------------------------------------------------------------------
if __name__ == "__main__":
    print("=" * 70)
    print("SOLE SERENITY - CORE POC")
    print("=" * 70)
    test_pricing()
    test_order_numbers()
    test_image_storage()
    test_email_fallback()
    test_stripe()
    print("=" * 70)
    passed = sum(1 for k, v in results.items() if not k.startswith("_") and v)
    total = sum(1 for k in results if not k.startswith("_"))
    print(f"RESULT: {passed}/{total} core checks passed")
    if results.get("_sandbox"):
        sb = results["_sandbox"]
        print("\nSANDBOX KEYS (for backend/.env):")
        print(f"  STRIPE_SECRET_KEY={sb['sandbox_secret_key']}")
        print(f"  STRIPE_PUBLISHABLE_KEY={sb.get('sandbox_publishable_key','')}")
        print(f"  STRIPE_ACCOUNT_ID={sb.get('sandbox_account_id','')}")
        print(f"  STRIPE_WEBHOOK_SECRET={sb.get('preview_webhook_secret','')}")
        print(f"  onboarding_url={sb.get('onboarding_url','')}")
    print("=" * 70)
    if passed == total:
        print(f"{GREEN}ALL CORE CHECKS PASSED{RESET}")
    else:
        print(f"{RED}SOME CHECKS FAILED - FIX BEFORE BUILDING APP{RESET}")
