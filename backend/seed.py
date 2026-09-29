"""Seed default settings, services, FAQ, gallery, and reviews on startup."""
import uuid
from database import settings_col, faq_col, gallery_col, reviews_col, now_iso
from pricing import (
    DEFAULT_QUICK_TIERS, DEFAULT_DEEP_TIERS, DEFAULT_QUICK_UNIT,
    DEFAULT_DEEP_UNIT, DEFAULT_SHIPPING_RATES,
)

DEFAULT_SETTINGS = {
    "_id": "app_settings",
    "business": {
        "name": "Sole Serenity",
        "tagline": "Clean \u2022 Protect \u2022 Restore",
        "email": "",
        "phone": "",
        "turnaround": "3\u20135 working days once your shoes arrive",
        "logo_file_id": "",
    },
    "pricing": {
        "quick_tiers": DEFAULT_QUICK_TIERS,
        "deep_tiers": DEFAULT_DEEP_TIERS,
        "quick_unit": DEFAULT_QUICK_UNIT,
        "deep_unit": DEFAULT_DEEP_UNIT,
    },
    "shipping_rates": DEFAULT_SHIPPING_RATES,
    "social": {
        "tiktok": "https://www.tiktok.com/@_soleserenity_",
        "instagram": "",
    },
    "analytics": {
        "google_analytics": "",
        "google_search_console": "",
        "meta_pixel": "",
        "tiktok_pixel": "",
    },
    "announcement": "",
    "maintenance_mode": False,
    "test_mode": True,
    "updated_at": now_iso(),
}

DEFAULT_FAQ = [
    {"q": "How does the delivery service work?", "a": "Once your order is approved and paid, we send you a prepaid tracked shipping label. You package your shoes, drop them at any drop-off point, and we clean and return them tracked to your door."},
    {"q": "How long does cleaning take?", "a": "Typically 3\u20135 working days from the moment your shoes arrive with us, plus delivery time each way."},
    {"q": "Can you remove every stain?", "a": "We achieve fantastic results, but results vary depending on material, age, staining and condition. We never promise that every mark can be fully removed \u2014 which is exactly why we assess your photos first."},
    {"q": "What happens if my shoes aren\u2019t suitable for cleaning?", "a": "If we don\u2019t think we can improve them, we\u2019ll tell you before you pay a penny. That\u2019s the whole point of our photo assessment."},
    {"q": "What shoes can you clean?", "a": "Trainers, sneakers and most everyday shoes across leather, suede, mesh, knit and canvas. Send us photos and we\u2019ll advise."},
    {"q": "How do I package my shoes?", "a": "Place them in a sturdy box or padded bag, remove any loose items, and attach your prepaid label. Keep your postage receipt until delivery is confirmed."},
    {"q": "How do I track my shoes?", "a": "Your order page shows live status updates and your tracking number for both the inbound and return journeys."},
    {"q": "Do you offer UK-wide delivery?", "a": "Yes \u2014 we offer tracked UK-wide collection and return via our courier partner."},
    {"q": "Can I send multiple pairs?", "a": "Absolutely. You can send up to 4 pairs in one order and even mix Quick and Deep cleans across pairs."},
    {"q": "Can I cancel my order?", "a": "You can cancel any time before payment. After payment, contact us as soon as possible and we\u2019ll help where we can."},
]

DEFAULT_REVIEWS = [
    {"name": "Jordan M.", "location": "Liverpool", "rating": 5, "text": "Sent my Air Max in looking destroyed and they came back like new. Unreal service.", "approved": True},
    {"name": "Aisha K.", "location": "Manchester", "rating": 5, "text": "The photo assessment gave me total confidence before paying. Deep clean was worth every penny.", "approved": True},
    {"name": "Tom R.", "location": "London", "rating": 5, "text": "Tracked delivery both ways, updates the whole time. My Jordans look box fresh.", "approved": True},
]


async def seed_all():
    if not await settings_col.find_one({"_id": "app_settings"}):
        await settings_col.insert_one(dict(DEFAULT_SETTINGS))
    if await faq_col.count_documents({}) == 0:
        for i, item in enumerate(DEFAULT_FAQ):
            await faq_col.insert_one({"id": str(uuid.uuid4()), "order": i, **item})
    # Reviews feature removed per business request \u2014 no seeding.


async def get_settings():
    s = await settings_col.find_one({"_id": "app_settings"}, {"_id": 0})
    return s or {}
