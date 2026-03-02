# MountTrack

## What This Is

MountTrack is a multi-tenant SaaS web application for taxidermy shop owners. Owners manage every active mount job through a visual stage board, and customers automatically receive branded text and email updates with a personal link to track their mount's progress and pay their balance online — no login required.

## Core Value

A taxidermy shop owner can intake a job, drag it through production stages, and have the customer automatically kept informed and able to pay — without the owner picking up the phone.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Shop & Onboarding**
- [ ] Shop owner can sign up and create a shop account
- [ ] Shop owner can upload logo and set a custom brand color used throughout the app and in all customer communications
- [ ] Shop owner pays a flat monthly subscription via Stripe Billing
- [ ] Owner dashboard supports dark and light mode

**Job Intake**
- [ ] Owner can log a new job with: customer name, phone, email, animal type, mount style, quoted price, deposit amount, photos, estimated completion date, and referral source
- [ ] Animal type is selectable from a predefined list (deer, fish, turkey, bear, etc.) with ability to add custom types
- [ ] Each job is automatically assigned a unique job number at intake
- [ ] Referral source field at intake (Facebook, Google, friend referral, walk-in, etc.) feeds into business reports

**Job Board & Stages**
- [ ] Visual Kanban-style stage board showing all active jobs by stage
- [ ] Owner can drag jobs between stages
- [ ] Stages are customizable per shop — owner can add, rename, and reorder (defaults: Skinning, Fleshing, Tanning, Mounting, Finishing, Ready for Pickup)
- [ ] Owner can bulk-select multiple jobs and move them to the next stage in one action
- [ ] Rush jobs can be flagged with a visual indicator on the board
- [ ] Jobs that have passed their estimated completion date are automatically flagged red (overdue)

**Queue & Calendar**
- [ ] Queue/backlog view shows all active jobs in order, estimated dates, and overall shop load
- [ ] Calendar view shows estimated completion dates across all active jobs so the owner can spot overcommitment
- [ ] Waitlist view: owner can add a customer to a pre-intake waitlist; customer receives a branded text confirming they're on the list

**Job Detail**
- [ ] Owner can update the estimated completion date at any time
- [ ] Internal notes feed on each job (owner-only, never visible to customers)
- [ ] Owner can upload progress photos to a job at any time

**Customer Portal (no login)**
- [ ] Customer receives a unique personal link via text and email at intake
- [ ] Portal is mobile-first with a visual progress timeline showing all stages
- [ ] Progress photos are viewable full-screen on tap
- [ ] Estimated completion date is shown and updates in real time when owner changes it
- [ ] Customer can pay remaining balance (full or partial) via Stripe on the portal

**Payments**
- [ ] Payment link is automatically sent to customer when job reaches "Ready for Pickup" stage
- [ ] Owner can also manually trigger the payment request at any point
- [ ] Customer can make partial payments, not just full balance
- [ ] Owner can track all payments, deposits, and outstanding balances per job

**Notifications**
- [ ] Every stage change automatically sends a branded SMS (Twilio) and email (Resend) to the customer
- [ ] All notifications display the shop's name and logo, not generic MountTrack branding
- [ ] Waitlist SMS sent at pre-intake confirming the customer is on the list

**Communication & Search**
- [ ] Full communication history (SMS + email) viewable per job
- [ ] Owner can search and filter jobs by status, animal type, customer name, job number, overdue, rush

**Supply Alerts**
- [ ] Owner can flag low stock on specific supplies (form sizes, eye types, etc.)
- [ ] App surfaces supply alerts on the dashboard as reminders before they delay jobs

**Reports**
- [ ] Revenue by month (deposits vs. final payments)
- [ ] Jobs by animal type
- [ ] Average turnaround time (per job, per stage)
- [ ] Outstanding balances (who owes what)
- [ ] Referral source breakdown (where customers are coming from)

**Mobile Owner Experience**
- [ ] Owner dashboard is fully functional on mobile — large touch targets, easy navigation
- [ ] Photo upload supports direct camera capture from a phone

### Out of Scope

- Native iOS / Android app — web app is mobile-first but not a native app
- Customer login or accounts — portal is always link-only
- Real-time chat between owner and customer — one-way notification model
- Multi-location support per shop — one shop per account for v1
- AI-generated completion date estimates — owner sets dates manually

## Context

- **Stack:** Next.js (App Router), Supabase (auth + database + storage), Stripe (shop subscriptions via Billing + customer payments via Payment Intents), Twilio (SMS), Resend (email), Vercel (deployment)
- **Multi-tenancy:** Every shop's data is fully isolated; Row Level Security in Supabase enforces per-shop boundaries
- **Two Stripe contexts:** (1) Recurring subscription billing for the shop owner account; (2) one-time/partial payment collection from customers on their portal
- **No customer auth:** Customer portal uses a unique token in the URL — no session, no account
- **Owner is mobile-first too:** Shop owners work on the floor, not at a desk — the owner-side UI must be just as usable on a phone as on desktop

## Constraints

- **Tech stack**: Next.js + Supabase + Stripe + Twilio + Resend + Vercel — already decided
- **Multi-tenant isolation**: Supabase RLS must enforce shop boundaries at the database level
- **No customer login**: Customer portal authentication is token-only (unique URL), never credentials
- **Branded communications**: All outbound SMS/email must be templated with shop branding, not generic

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Multi-tenant SaaS (not single-shop) | Product serves any taxidermy shop, not just one | — Pending |
| Customizable stages with defaults | Different shops have different workflows | — Pending |
| Partial payments supported | Customers may want to pay in installments before pickup | — Pending |
| No customer login — token URL only | Reduces friction, no account management complexity | — Pending |
| Flat monthly subscription (not per-job) | Predictable revenue, simpler billing for v1 | — Pending |
| Both auto + manual payment trigger | Auto covers the standard case, manual covers exceptions | — Pending |

---
*Last updated: 2026-03-01 after initialization*
