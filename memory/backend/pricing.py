"""Pricing engine: tiered per-service pricing + shipping rules.

Tier tables represent the TOTAL price for N pairs of a single service.
Mixed orders are grouped by service and each group is priced by its own tier.
"""

DEFAULT_QUICK_TIERS = {"1": 15.00, "2": 30.00, "3": 45.00, "4": 60.00}
DEFAULT_DEEP_TIERS = {"1": 20.00, "2": 40.00, "3": 60.00, "4": 80.00}
DEFAULT_QUICK_UNIT = 15.00
DEFAULT_DEEP_UNIT = 20.00

DEFAULT_SHIPPING_RATES = [
    {"min_pairs": 1, "max_pairs": 1, "price": 14.99, "label": "1 pair"},
    {"min_pairs": 2, "max_pairs": 2, "price": 19.99, "label": "2 pairs"},
    {"min_pairs": 3, "max_pairs": 3, "price": 24.99, "label": "3 pairs"},
    {"min_pairs": 4, "max_pairs": 99, "price": 29.99, "label": "4 pairs"},
]


def _tier_price(service, count, pricing):
    if count <= 0:
        return 0.0
    if service == "quick":
        tiers = pricing.get("quick_tiers", DEFAULT_QUICK_TIERS)
        unit = pricing.get("quick_unit", DEFAULT_QUICK_UNIT)
    else:
        tiers = pricing.get("deep_tiers", DEFAULT_DEEP_TIERS)
        unit = pricing.get("deep_unit", DEFAULT_DEEP_UNIT)
    keys = sorted(int(k) for k in tiers.keys())
    max_tier = max(keys)
    if count <= max_tier:
        return round(float(tiers[str(count)]), 2)
    return round(float(tiers[str(max_tier)]) + (count - max_tier) * float(unit), 2)


def shipping_cost(total_pairs, rates=None):
    if not rates:
        rates = DEFAULT_SHIPPING_RATES
    for r in rates:
        if int(r["min_pairs"]) <= total_pairs <= int(r["max_pairs"]):
            return round(float(r["price"]), 2)
    highest = max(rates, key=lambda r: int(r["max_pairs"]))
    return round(float(highest["price"]), 2)


def calculate_order(items, pricing=None, shipping_rates=None):
    """items: list of dicts each having a 'service' key ('quick'|'deep').
    Returns pricing breakdown dict."""
    pricing = pricing or {}
    counts = {"quick": 0, "deep": 0}
    for it in items:
        svc = it.get("service", "quick")
        if svc not in counts:
            svc = "quick"
        counts[svc] += 1
    quick_total = _tier_price("quick", counts["quick"], pricing)
    deep_total = _tier_price("deep", counts["deep"], pricing)
    cleaning = round(quick_total + deep_total, 2)
    total_pairs = len(items)
    ship = shipping_cost(total_pairs, shipping_rates)
    return {
        "quick_count": counts["quick"],
        "deep_count": counts["deep"],
        "quick_total": quick_total,
        "deep_total": deep_total,
        "cleaning_total": cleaning,
        "shipping_total": ship,
        "grand_total": round(cleaning + ship, 2),
        "total_pairs": total_pairs,
    }
