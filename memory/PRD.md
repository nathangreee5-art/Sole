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

## Backlog / Next
- P1: Claim Stripe sandbox (onboarding_url) + rotate the exposed live key before going live.
- P1: Verify Mailgun DNS (SPF/DKIM/DMARC) so emails land in inbox.
- P2: Activate Royal Mail live labels (set SHIPPING_PROVIDER + credentials) when account approved.
- P2: Fill gallery with real before/after photos via admin.
