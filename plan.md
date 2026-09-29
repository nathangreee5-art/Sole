# plan.md

## 1. Objectives
- Deliver a production-ready FARM-stack (FastAPI + React + MongoDB) web platform for **Sole Serenity** (Clean • Protect • Restore) with a premium mobile-first UI.
- Implement the **mandatory workflow**: Photo Assessment → Admin Approval → Payment → Shipping Labels → Cleaning Lifecycle → Return → Completion → Review.
- Build **real, testable Stripe payments** in GBP using **Emergent claimable sandbox (Flow A)**; dynamic totals computed server-side; support refunds.
- Build an **email notification system** that works now via DB/log fallback, with pluggable provider credentials later.
- Build **Royal Mail integration architecture + manual label fallback**, clearly marked as requiring live creds before launch.
- Provide a **professional admin dashboard**, editable pricing/shipping/FAQ/gallery/settings, and secure data isolation.

---

## 2. Implementation Steps

### Phase 1 — Core POC (isolation; do not proceed until green)
**Goal:** prove the failure-prone core (payments + uploads + pricing + email logging) works end-to-end without the full UI.

**User stories (POC)**
1. As a customer, I can submit an assessment with multiple photos and notes so Sole Serenity can evaluate my shoes.
2. As the system, I can compute the correct total for mixed services across multiple pairs using tier pricing.
3. As a customer, I can pay via Stripe hosted checkout for the exact server-calculated amount in GBP.
4. As the system, I can confirm payment status reliably (polling + webhook path) before marking an order paid.
5. As the business, I can “send” emails even without a provider configured, and still have a stored audit trail.

**Steps**
- Websearch best practices for: Stripe Checkout dynamic pricing (server-side), secure image upload patterns, and UK postcode validation approach.
- Create a single Python script (`poc_core.py`) that validates:
  - **Stripe Flow A**: provision claimable sandbox; create GBP Checkout Session; retrieve status; store transaction in Mongo.
  - **Order number generator**: monotonic `SS-10001+` (atomic counter in Mongo).
  - **Pricing engine**: tier lookup per service group (Quick/Deep), mixed per-pair supported; shipping rules (1–3, 4).
  - **Image storage**: upload base64 images to Mongo (GridFS) + retrieve + verify bytes.
  - **Email fallback**: write outbound email payloads to `email_notifications` + backend logs.
- Fix until all POC assertions pass repeatedly.

**Deliverable:** POC script + minimal supporting backend utilities; documented env vars and how to run.

---

### Phase 2 — V1 App Development (build the product around proven core)
**User stories (V1)**
1. As a visitor on mobile, I can understand the service, pricing, and process quickly and tap **Book a Clean** in one step.
2. As a customer, I can submit an assessment with guided photo slots (front/side/back/sole/problem areas) and minimal typing.
3. As a customer, I can track my order status, see photos, and view shipping labels/tracking from a single page.
4. As an admin, I can review photos, request more info/photos, approve/decline, and move the order forward through statuses.
5. As an admin, I can manage prices/shipping rates/FAQ/gallery/settings without code changes.

**Backend (FastAPI)**
- Data models/collections: users(optional), orders, order_items/pairs, uploaded_images (GridFS refs), payments, shipments, email_notifications, gallery_images, faq_items, settings, counters.
- Orders:
  - Create assessment (no payment) → status `PENDING ASSESSMENT`.
  - Admin actions: approve/request info/photos/decline; status transitions enforced.
  - Status enum exactly as specified; server-side validation for allowed transitions.
- Payments (Stripe Flow A):
  - Create checkout session for **approved** orders only; amount computed server-side (cleaning + delivery).
  - Store `payment_status` (UNPAID/PENDING/PAID/REFUNDED/PARTIALLY REFUNDED) + Stripe IDs.
  - Webhook endpoint + polling status endpoint.
  - Refund endpoints (admin-only) for full/partial.
- Uploads:
  - Secure upload endpoints (type/size limits); associate with order; serve via signed/authorized fetch.
- Email system:
  - Template-based events; enqueue on state changes; fallback persists in DB + logs.
- Royal Mail module (architecture + fallback):
  - `ShippingProvider` interface; `RoyalMailProvider` stub wired to env vars.
  - Manual fallback: admin upload label PDF + set tracking URL/number.
  - Shipment objects: inbound + return label, tracking fields, timestamps.
- Security:
  - JWT auth with roles (admin/customer) **kept minimal in V1**; ensure cross-order access blocked.
  - Guest-friendly order lookup via secure token link/email (customer portal) if login is skipped initially.

**Frontend (React)**
- Premium black/charcoal UI, white typography, teal/mint accents; subtle texture/brush elements; fast mobile UX.
- Pages: Home, Services, How It Works, Delivery, Book a Clean, About, FAQ, Contact, Terms, Privacy.
- Booking flow:
  - Multi-step mobile form with progress; address fields UK-friendly; image capture/upload optimized.
  - Confirmation page with order number + next steps (assessment pending).
- Customer portal:
  - View status timeline, uploaded photos, notes, payment button when approved, label download, tracking links.
- Admin dashboard:
  - Queue metrics + filters; order detail view (photos, notes, customer info).
  - Actions: request more info/photos, approve/decline, generate payment link, mark statuses, upload labels, add tracking, refunds.
- SEO basics: metadata, OG tags, alt text, sitemap/robots.
- Analytics placeholders in settings (GA/Meta/TikTok) without hard-coded IDs.

**End of Phase 2:** run 1 round of end-to-end testing (customer assessment → admin approve → pay → label upload → status changes → emails logged).

---

### Phase 3 — Production hardening + expanded features
**User stories (hardening/features)**
1. As a customer, I can optionally create an account to see my full order history across devices.
2. As an admin, I can edit FAQs/gallery/social links and instantly see changes on the website.
3. As a customer, I receive timely lifecycle emails with consistent order numbers and links.
4. As an admin, I can export orders/revenue summaries for bookkeeping.
5. As the business, I can enable Royal Mail live integration without code changes once creds are added.

**Steps**
- Add optional customer accounts (email/password magic link) + order history; keep guest flow.
- Implement review request + reviews moderation (admin approve for homepage display).
- Improve address validation (postcode checks; optional external lookup if feasible).
- Royal Mail live integration completion (when creds available): create shipment, fetch label PDF, store + email; robust retries.
- Security pass: rate limits on uploads/auth; audit logs for admin actions.
- Run 1 round of full end-to-end testing across mobile + desktop, including refunds and manual label fallback.

---

### Phase 4 — Ongoing enhancements
**User stories (enhancements)**
1. As a customer, I can receive SMS updates in addition to email.
2. As an admin, I can define more complex shipping rules (weight, destination zones, service type).
3. As an admin, I can manage turnaround times/holiday closures with automatic customer messaging.
4. As a customer, I can rebook a previous order in 2 taps.
5. As the business, I can add add-ons (protectant, deodorize) without breaking pricing.

---

## 3. Next Actions
1. Implement Phase 1 POC script and supporting utilities (pricing, order counter, image storage, email logging, Stripe Flow A provisioning).
2. Confirm POC green; only then start V1 app build.
3. Build V1 backend + frontend in one cohesive pass, wired to the proven core modules.
4. Run end-to-end test cycle; fix issues.

---

## 4. Success Criteria
- POC script consistently passes: Stripe checkout + status confirmation (GBP), image upload/retrieve, email logging, SS order numbering, mixed tier pricing.
- Customer cannot pay before admin approval; no bypass of assessment gate.
- Admin can fully operate the lifecycle: approve/request info, collect payment, manage shipping labels (manual fallback), move statuses, issue refunds.
- Customer portal always shows correct status/payment/shipping/label access and is mobile-first usable.
- Royal Mail integration is correctly structured server-side with explicit “needs live creds” flags; manual fallback works.
- No sensitive keys exposed; cross-customer data access prevented; uploads validated and secured.
