# Roadmap: MountTrack

## Overview

MountTrack ships in seven phases, each delivering a coherent, independently verifiable capability. The sequence is security-first: the tenant isolation model and authentication are locked in before a single feature is built, because RLS misconfiguration is silent and cannot be safely retrofitted. From there, the owner workflow comes before the customer-facing surface — you cannot show a portal for jobs that don't exist. Payments and notifications layer on top of the job lifecycle. The final phase completes v1 with operational visibility (reports, supply alerts, post-completion automation, and social consent).

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Auth, shop setup, subscription billing, and the multi-tenant security model
- [ ] **Phase 2: Job Intake & Board** - Job creation with all intake fields, visual Kanban stage board with drag-and-drop
- [ ] **Phase 3: Job Detail, Views & Search** - Job detail page, queue and calendar views, search and filters
- [ ] **Phase 4: Customer Portal** - Token-gated no-login portal showing job status, photos, and branded shop identity
- [ ] **Phase 5: Payments** - Stripe customer payments on portal, partial payments, balance tracking
- [ ] **Phase 6: Notifications & Waitlist** - Automated branded SMS and email on stage changes, waitlist flow
- [ ] **Phase 7: Reports, Supply, Post-Completion & Social** - Revenue reports, supply alerts, post-pickup automation, social consent

## Phase Details

### Phase 1: Foundation
**Goal**: A shop owner can create an account, configure their shop, and have an active paid subscription — with a security model that enforces complete tenant isolation at the database level.
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, SHOP-01, SHOP-02, SHOP-03, SHOP-04, SHOP-05
**Success Criteria** (what must be TRUE):
  1. Owner can sign up with email and password, log in, stay logged in across sessions, and reset a forgotten password via email link
  2. Owner can set shop name, address, contact details, upload a logo, and set a custom brand color that appears throughout the app
  3. Owner can subscribe to MountTrack via Stripe Billing and access the dashboard only while subscription is active
  4. Owner can toggle the dashboard between dark and light mode
  5. All shop data is isolated at the database level — no query by one shop can return data belonging to another shop
**Plans**: 4 plans

Plans:
- [x] 01-01-PLAN.md — Project scaffold, Supabase schema + RLS, Stripe client, proxy.ts auth gate
- [x] 01-02-PLAN.md — Auth pages (signup, login, forgot-password, update-password) + PKCE confirm route
- [x] 01-03-PLAN.md — Onboarding wizard (shop setup + Stripe Checkout) + webhook handler
- [x] 01-04-PLAN.md — Dashboard shell, settings pages (Shop/Branding/Subscription), logo upload, brand color, dark mode

### Phase 2: Job Intake & Board
**Goal**: The owner can create a job with all required fields, see every active job on a visual Kanban board, and move jobs between stages.
**Depends on**: Phase 1
**Requirements**: INTAKE-01, INTAKE-02, INTAKE-03, INTAKE-04, INTAKE-05, INTAKE-06, INTAKE-07, INTAKE-08, BOARD-01, BOARD-02, BOARD-03, BOARD-04, BOARD-05, BOARD-06, BOARD-07
**Success Criteria** (what must be TRUE):
  1. Owner can create a job capturing customer name, phone, email, animal type, mount style, quoted price, deposit, estimated completion date, referral source, and photos — and the job receives a unique job number automatically
  2. All active jobs appear on a Kanban board with one column per stage, each column showing its job count
  3. Owner can drag a job card to a different stage column and the board updates immediately
  4. Owner can customize stages for their shop — add, rename, and reorder — with sensible defaults pre-loaded (Skinning, Fleshing, Tanning, Mounting, Finishing, Ready for Pickup)
  5. Rush jobs show a visual rush indicator; jobs past their estimated completion date show a distinct overdue indicator
**Plans**: TBD

### Phase 3: Job Detail, Views & Search
**Goal**: The owner has full access to every piece of job information, can manage job records over their lifecycle, and can find any job instantly via search and filtering.
**Depends on**: Phase 2
**Requirements**: JOB-01, JOB-02, JOB-03, JOB-04, JOB-05, QUEUE-01, QUEUE-02, QUEUE-03, SEARCH-01, SEARCH-02
**Success Criteria** (what must be TRUE):
  1. Owner can open any job, edit any field, add internal notes visible only to them, upload progress photos (including direct camera capture on mobile), and update the estimated completion date
  2. Owner can view a queue showing all active jobs ordered by estimated completion date with stage counts
  3. Owner can view a calendar showing all active jobs plotted by their estimated completion date, allowing the owner to spot overcommitment before promising dates to new customers
  4. Owner can search jobs by customer name, job number, or animal type and filter by stage, overdue status, rush status, or date range
  5. Owner can view the full communication history (all SMS and emails sent) for any job
**Plans**: TBD

### Phase 4: Customer Portal
**Goal**: Customers can follow their mount's progress through a branded, no-login portal accessible via a unique personal link — with real-time status, photos, and the shop's identity throughout.
**Depends on**: Phase 2
**Requirements**: PORTAL-01, PORTAL-02, PORTAL-03, PORTAL-04, PORTAL-05, PORTAL-06, PORTAL-07, PORTAL-08
**Success Criteria** (what must be TRUE):
  1. Customer receives a unique personal link via SMS and email at job intake and can open their portal with no login or account required
  2. Portal shows a visual stage timeline with the current stage highlighted, and the estimated completion date updates in real time when the owner changes it
  3. Portal shows progress photos the owner has uploaded; customer can tap any photo to view it full-screen
  4. Portal is entirely branded with the shop's logo, name, and brand color — the name "MountTrack" is never visible to the customer
  5. Portal renders correctly on mobile with a single-column layout, large touch targets, and no horizontal scroll
**Plans**: TBD

### Phase 5: Payments
**Goal**: Customers can pay their balance (in full or partially) directly from their portal, and the owner has full visibility into every payment, deposit, and outstanding balance.
**Depends on**: Phase 4
**Requirements**: PAY-01, PAY-02, PAY-03, PAY-04, PAY-05, PAY-06
**Success Criteria** (what must be TRUE):
  1. Customer can pay their remaining balance via Stripe on the portal — they can pay the full amount or a partial amount
  2. A payment link is automatically sent to the customer when their job reaches "Ready for Pickup" stage; the owner can also manually trigger a payment request from the job detail page at any time
  3. Owner can view all payments, deposits, and the outstanding balance for any individual job
  4. Owner dashboard shows the total outstanding balance across all active jobs
**Plans**: TBD

### Phase 6: Notifications & Waitlist
**Goal**: Every stage change automatically triggers branded, shop-identity communications to the customer — and the owner can place customers on a pre-intake waitlist that immediately confirms their spot via SMS.
**Depends on**: Phase 4
**Requirements**: NOTIF-01, NOTIF-02, NOTIF-03, NOTIF-04, WAIT-01, WAIT-02
**Success Criteria** (what must be TRUE):
  1. Every time a job moves to a new stage, the customer automatically receives a branded SMS (via Twilio) and a branded email (via Resend) — both show the shop's name and logo with no MountTrack branding
  2. Customer can opt out of SMS by replying STOP; the opt-out is recorded and respected on all future messages (A2P 10DLC compliant)
  3. Owner can add a customer to a pre-intake waitlist with their name, phone, and animal type; the waitlisted customer immediately receives a branded SMS confirming they are on the list
**Plans**: TBD

### Phase 7: Reports, Supply, Post-Completion & Social
**Goal**: The owner has operational visibility into revenue, outstanding balances, animal volume, and referral sources — plus supply reminders, post-pickup automation for reviews and ratings, PDF receipts for paid customers, and social media consent tracking.
**Depends on**: Phase 6
**Requirements**: REPORT-01, REPORT-02, REPORT-03, REPORT-04, REPORT-05, SUPPLY-01, SUPPLY-02, POST-01, POST-02, POST-03, POST-04, POST-05, DOC-01, SOCIAL-01, SOCIAL-02
**Success Criteria** (what must be TRUE):
  1. Owner can view revenue reports by month (deposits vs. final payments separately), outstanding balances by customer, job volume by animal type, and referral source breakdown
  2. Owner can view all customer satisfaction ratings (captured from 1–5 SMS replies) on their dashboard, and the rating is visible on the individual job detail page
  3. Owner can flag supplies as low stock; active low-stock flags appear as alerts on the dashboard
  4. After a job is marked complete, the customer automatically receives a branded SMS with the shop's Google review link and a separate SMS requesting a 1–5 rating reply
  5. After a customer's final payment, they automatically receive a PDF receipt via email containing shop name, logo, animal details, amount paid, and date
  6. Job intake form includes a social media consent checkbox; consent status is visible on the job detail page and on photos flagged as shareable
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 4/4 | Checkpoint Pending | 2026-03-02 |
| 2. Job Intake & Board | 0/TBD | Not started | - |
| 3. Job Detail, Views & Search | 0/TBD | Not started | - |
| 4. Customer Portal | 0/TBD | Not started | - |
| 5. Payments | 0/TBD | Not started | - |
| 6. Notifications & Waitlist | 0/TBD | Not started | - |
| 7. Reports, Supply, Post-Completion & Social | 0/TBD | Not started | - |
