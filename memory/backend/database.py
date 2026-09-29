"""MongoDB connection, GridFS bucket, and shared constants for Sole Serenity."""
import os
from pathlib import Path
from datetime import datetime, timezone
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket
from pymongo import ReturnDocument

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
fs_bucket = AsyncIOMotorGridFSBucket(db)

# Collections
orders = db.orders
settings_col = db.settings
gallery_col = db.gallery_images
faq_col = db.faq_items
reviews_col = db.reviews
emails_col = db.email_notifications
payments_col = db.payment_transactions
users_col = db.users
counters_col = db.counters
contact_col = db.contact_messages
tickets_col = db.tickets


def now_iso():
    return datetime.now(timezone.utc).isoformat()


async def next_order_number():
    doc = await counters_col.find_one_and_update(
        {"_id": "order_number"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return f"SS-{10000 + doc['seq']}"


# ---- Order status lifecycle (canonical) ----
ORDER_STATUSES = [
    "PENDING_ASSESSMENT",
    "AWAITING_CUSTOMER_INFORMATION",
    "APPROVED",
    "AWAITING_PAYMENT",
    "PAID",
    "LABEL_GENERATED",
    "AWAITING_SHOES",
    "SHOES_IN_TRANSIT",
    "SHOES_RECEIVED",
    "CLEANING",
    "QUALITY_CHECK",
    "READY_FOR_RETURN",
    "RETURN_LABEL_GENERATED",
    "RETURN_IN_TRANSIT",
    "DELIVERED",
    "COMPLETED",
    "CANCELLED",
    "REFUNDED",
]

STATUS_LABELS = {
    "PENDING_ASSESSMENT": "Pending assessment",
    "AWAITING_CUSTOMER_INFORMATION": "Awaiting your info",
    "APPROVED": "Approved",
    "AWAITING_PAYMENT": "Awaiting payment",
    "PAID": "Paid",
    "LABEL_GENERATED": "Label ready",
    "AWAITING_SHOES": "Awaiting your shoes",
    "SHOES_IN_TRANSIT": "Shoes in transit to us",
    "SHOES_RECEIVED": "Shoes received",
    "CLEANING": "Cleaning in progress",
    "QUALITY_CHECK": "Quality check",
    "READY_FOR_RETURN": "Ready for return",
    "RETURN_LABEL_GENERATED": "Return label ready",
    "RETURN_IN_TRANSIT": "On its way back",
    "DELIVERED": "Delivered",
    "COMPLETED": "Completed",
    "CANCELLED": "Cancelled",
    "REFUNDED": "Refunded",
}

# Payment statuses
PAYMENT_STATUSES = ["UNPAID", "PAYMENT_PENDING", "PAID", "REFUNDED", "PARTIALLY_REFUNDED"]

# Statuses at which the customer is allowed to pay
PAYABLE_STATUSES = {"APPROVED", "AWAITING_PAYMENT"}


def clean_doc(doc):
    """Remove Mongo _id for JSON responses."""
    if not doc:
        return doc
    doc.pop("_id", None)
    return doc
