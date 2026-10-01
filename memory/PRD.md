# Sole Serenity — PRD

## Original Problem Statement
Pull the `Sole` project from GitHub (https://github.com/codevortex2026-oss/Sole) and fix missing code to make it function. User request: "Fix any bugs."

## What This App Is
UK shoe-cleaning website + ordering system. Photo-assessment-first workflow: customers book, upload photos, admin assesses/approves, customer pays (Stripe), shoes shipped both ways (courier), full 18-status order lifecycle with lifecycle emails.

## Architecture
- Backend: FastAPI (modular routers: public, orders, payments, admin), MongoDB (motor) + GridFS for photos/labels, JWT admin auth.
- Frontend: React (CRA + craco), Tailwind, shadcn/ui, dark charcoal + accent aesthetic.
- Integrations: Stripe (Flow A claimable sandbox, TEST mode) for GBP checkout + refunds; Mailgun EU for emails (graceful fallback-to-logged); Royal Mail Click & Drop (manual/test mode by default).

## Setup Done (2026-06 / this session)
- Cloned full codebase from GitHub into /app (was only boilerplate before).
- Installed backend (pip) + frontend (yarn) dependencies.
- Provisioned Emergent Stripe claimable sandbox; wired STRIPE_SECRET_KEY/PUBLISHABLE/ACCOUNT/WEBHOOK_SECRET (test mode) into backend/.env.
- Configured Mailgun EU (MAILGUN_API_KEY, DOMAIN=soleserenity.co.uk, BASE_URL=api.eu.mailgun.net, EMAIL_FROM=no-reply@soleserenity.co.uk).
- Set JWT_SECRET, ADMIN_EMAIL/ADMIN_PASSWORD.
- Verified end-to-end: 25/25 backend tests + all frontend customer + admin flows passed. No bugs found.
- Reset DB (removed test artifacts, counter -> next order SS-10001, cleared announcement).

## Credentials
- Admin: admin@soleserenity.co.uk / SoleAdmin2025! (see memory/test_credentials.md)

## Session 2 additions (verified)
- NEW on-screen Booking Confirmation on /book: after submit, shows order number, access code, direct order link with copy buttons, "View my order" + "Track later". (iteration_5: 8/8 backend + full frontend flow passed.)
- Royal Mail ACTIVATED (SHIPPING_PROVIDER=royal_mail): inbound Returns Portal URL live (https://return.royalmail.com/cf63...), outbound Click & Drop API key + service code (NDA) configured. Test Mode kept ON → outbound labels simulated (TEST tracking, no real order/charge) until user flips test_mode off. Service code "NDA" only exercised for real once test mode is off — verify then.
- Contact / ticket service verified end-to-end via live calls: POST /api/contact -> ticket + admin notify + customer receipt; two-way conversation (customer /api/conversations, admin /api/admin/tickets reply); all Mailgun emails status=sent.

## LIVE / PUBLISH-READY (session 3)
- Stripe: LIVE mode using the owner's real GB account (sk_live_..., charges_enabled + payouts_enabled + details_submitted all true). STRIPE_MODE=live. STRIPE_WEBHOOK_SECRET blanked — payment confirmation works via polling fallback (GET /api/payments/status). SECURITY: live key was exposed in chat — owner advised to roll it in Stripe and re-set.
- Royal Mail: LIVE, Test Mode OFF (test_mode=false). Real Click & Drop outbound labels will be created + billed when admin generates them; service code NDA to be validated on first real label. Inbound via Returns Portal.
- Email: Mailgun EU live (status=sent verified).
- Deployment readiness: deployment_agent = WARN (deployable; only non-blocking query-perf suggestions). No blockers.

## SEO / sitemap (session 4)
- Added frontend/public/sitemap.xml (11 public pages, canonical domain https://soleserenity.co.uk) + robots.txt (allows public, disallows /admin /order /conversation /payment, references sitemap).
- Verified: /sitemap.xml serves as application/xml (200) even to Googlebot; /robots.txt serves 200. SPA fallback returns HTML only for unknown routes (expected).
- Google "HTML not XML" error = the submitted URL returned HTML, i.e. soleserenity.co.uk not yet pointed to the app (registrar parked page) OR wrong host submitted. Sitemap <loc> URLs must match the live host.
- PENDING user input: exact live/deployed domain. Once known, update sitemap <loc> + robots Sitemap line to match, then submit in Google Search Console.

## SEO optimisation (session 5)
- Added react-helmet-async + reusable Seo component (frontend/src/components/common/Seo.jsx); HelmetProvider in index.js.
- Per-page unique titles, meta descriptions, business-matched keywords, canonical (https://soleserenity.co.uk + path) on all public pages: Home, Services, How It Works, Delivery, About, FAQ, Contact, Terms, Privacy, Book, Track.
- robots: index,follow on public; noindex,nofollow on OrderTracking, PaymentResult, Conversation, AdminLogin, AdminLayout (all admin children).
- Structured data: LocalBusiness (index.html, sitewide), FAQPage (FAQ page, from live FAQ data), OfferCatalog with Quick/Deep offers (Services page).
- Cleaned index.html: single source of truth for OG/Twitter defaults + LocalBusiness JSON-LD; removed static description/keywords/robots to avoid duplicate meta (Helmet manages per-page). Verified descCount=1 per page.
- NOTE: SPA (no SSR) — Google renders JS so sees per-page tags; social scrapers use the static OG defaults. Canonical domain = soleserenity.co.uk (update if live domain differs).

## Backlog / Next
- P1: Claim Stripe sandbox (onboarding_url) + rotate the exposed live key before going live.
- P1: Verify Mailgun DNS (SPF/DKIM/DMARC) so emails land in inbox.
- P2: Activate Royal Mail live labels (set SHIPPING_PROVIDER + credentials) when account approved.
- P2: Fill gallery with real before/after photos via admin.
