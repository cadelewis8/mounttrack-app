# Requirements: MountTrack

**Defined:** 2026-03-01
**Core Value:** A taxidermy shop owner can intake a job, drag it through production stages, and have the customer automatically kept informed and able to pay — without the owner picking up the phone.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication (AUTH)

- [x] **AUTH-01**: Owner can create a shop account with email and password
- [x] **AUTH-02**: Owner can log in and stay logged in across browser sessions
- [x] **AUTH-03**: Owner can reset password via email link

### Shop Setup (SHOP)

- [x] **SHOP-01**: Owner can set shop name, address, and contact details
- [x] **SHOP-02**: Owner can upload a shop logo used throughout the app and all customer communications
- [x] **SHOP-03**: Owner can set a custom brand color applied to the app UI and customer portal
- [x] **SHOP-04**: Owner can subscribe to MountTrack with a flat monthly fee via Stripe Billing
- [x] **SHOP-05**: Owner dashboard supports dark mode and light mode with a manual toggle

### Job Intake (INTAKE)

- [x] **INTAKE-01**: Owner can create a job with customer name, phone, and email
- [x] **INTAKE-02**: Owner can select animal type from a predefined list (deer, fish, turkey, bear, bird, etc.) or add a custom type
- [x] **INTAKE-03**: Owner can specify mount style (shoulder, full body, European, fish panel, etc.)
- [ ] **INTAKE-04**: Each job is automatically assigned a unique job number at creation
- [x] **INTAKE-05**: Owner can record quoted price and deposit amount at intake
- [x] **INTAKE-06**: Owner can set an estimated completion date at intake
- [x] **INTAKE-07**: Owner can select a referral source at intake (Facebook, Google, word of mouth, walk-in, other) or add a custom source
- [x] **INTAKE-08**: Owner can upload photos at intake

### Job Board & Stages (BOARD)

- [x] **BOARD-01**: Owner can view all active jobs on a visual Kanban stage board with one column per stage
- [x] **BOARD-02**: Owner can drag a job card between stage columns
- [x] **BOARD-03**: Owner can customize stages per shop — add, rename, and reorder (defaults: Skinning, Fleshing, Tanning, Mounting, Finishing, Ready for Pickup)
- [ ] **BOARD-04**: Owner can bulk-select multiple job cards and move them all to a specified stage in one action
- [x] **BOARD-05**: Owner can mark a job as Rush — job card shows a visual rush indicator on the board
- [x] **BOARD-06**: Jobs that have passed their estimated completion date are automatically flagged as overdue with a distinct visual indicator on the board
- [x] **BOARD-07**: Each stage column displays the job count for that stage

### Queue & Calendar (QUEUE)

- [x] **QUEUE-01**: Owner can view a queue/backlog view showing all active jobs ordered by estimated completion date with per-stage job counts
- [x] **QUEUE-02**: Owner can view a calendar view showing all active jobs plotted by their estimated completion date
- [x] **QUEUE-03**: Calendar view allows the owner to identify weeks where too many jobs are due at once before promising dates to new customers

### Waitlist (WAIT)

- [ ] **WAIT-01**: Owner can add a customer to a pre-intake waitlist with name, phone, and animal type before the animal is dropped off
- [ ] **WAIT-02**: Waitlisted customer automatically receives a branded SMS confirming they are on the list

### Job Detail (JOB)

- [x] **JOB-01**: Owner can view and edit any job field after intake
- [x] **JOB-02**: Owner can update the estimated completion date at any time
- [x] **JOB-03**: Owner can upload progress photos to a job at any time (including direct camera capture on mobile)
- [x] **JOB-04**: Owner can add internal notes to a job via a chronological notes feed — never visible to customers
- [x] **JOB-05**: Owner can view the full communication history (all SMS and emails sent) per job

### Customer Portal (PORTAL)

- [ ] **PORTAL-01**: Customer receives a unique personal link via SMS and email at job intake
- [ ] **PORTAL-02**: Customer can open their portal via the personal link with no login or account required
- [ ] **PORTAL-03**: Portal shows a visual progress timeline of all stages with the current stage highlighted
- [ ] **PORTAL-04**: Portal shows the estimated completion date; updates in real time when the owner changes it
- [ ] **PORTAL-05**: Portal is mobile-first — single column layout, large touch targets, no horizontal scroll
- [ ] **PORTAL-06**: Customer can view progress photos the owner has uploaded
- [ ] **PORTAL-07**: Customer can tap any photo to view it full-screen
- [ ] **PORTAL-08**: Portal is branded with the shop's logo, name, and custom brand color — no MountTrack branding is visible to the customer

### Payments (PAY)

- [ ] **PAY-01**: Customer can pay their remaining balance via Stripe on the customer portal
- [ ] **PAY-02**: Customer can make a partial payment (not required to pay full balance at once)
- [ ] **PAY-03**: A payment link is automatically sent to the customer via SMS and email when their job reaches "Ready for Pickup" stage
- [ ] **PAY-04**: Owner can manually trigger a payment request to a customer at any point from the job detail page
- [ ] **PAY-05**: Owner can view all payments, deposits, and outstanding balance per job
- [ ] **PAY-06**: Owner dashboard shows total outstanding balance across all active jobs

### Notifications (NOTIF)

- [ ] **NOTIF-01**: Every stage change automatically sends the customer a branded SMS via Twilio
- [ ] **NOTIF-02**: Every stage change automatically sends the customer a branded email via Resend
- [ ] **NOTIF-03**: All SMS and email notifications display the shop's name and logo — MountTrack branding is never shown to the customer
- [ ] **NOTIF-04**: Customers can opt out of SMS via STOP keyword; opt-outs are handled and respected (A2P 10DLC compliant)

### Search & Filters (SEARCH)

- [x] **SEARCH-01**: Owner can search active and past jobs by customer name, job number, or animal type
- [x] **SEARCH-02**: Owner can filter jobs by stage, overdue status, rush status, or date range

### Supply Alerts (SUPPLY)

- [ ] **SUPPLY-01**: Owner can flag specific supplies as low stock (e.g., a specific form size or eye type)
- [ ] **SUPPLY-02**: Active low-stock flags are surfaced as alerts on the owner dashboard

### Reports (REPORT)

- [ ] **REPORT-01**: Owner can view revenue by month showing deposit totals and final payment totals separately
- [ ] **REPORT-02**: Owner can view outstanding balances — list of customers with amounts owed
- [ ] **REPORT-03**: Owner can view job volume by animal type (how many deer, fish, turkey, etc.)
- [ ] **REPORT-04**: Owner can view referral source breakdown (how many customers came from each source)
- [ ] **REPORT-05**: Owner can view all customer satisfaction ratings on their dashboard

### Post-Completion Automation (POST)

- [ ] **POST-01**: Owner can set their Google review URL once in shop settings
- [ ] **POST-02**: After a job is marked complete, the customer automatically receives a branded SMS with the shop's Google review link
- [ ] **POST-03**: After a job is marked complete, the customer automatically receives a branded SMS asking them to rate their experience by replying 1–5
- [ ] **POST-04**: Inbound rating replies (1–5) are captured and stored against the job record
- [ ] **POST-05**: Customer's satisfaction rating is visible on the job detail page

### Documents (DOC)

- [ ] **DOC-01**: After a customer's final payment, an auto-generated PDF receipt is emailed to the customer containing shop name, logo, animal details, amount paid, and date

### Social Media Consent (SOCIAL)

- [x] **SOCIAL-01**: Job intake form includes a checkbox for the customer to opt-in to allowing the shop to share photos of their finished mount on social media
- [x] **SOCIAL-02**: Photo sharing opt-in status is visible on the job detail page and on any uploaded photos flagged as shareable

---

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Reports

- **REPORT-V2-01**: Average turnaround time per job (intake to Ready for Pickup)
- **REPORT-V2-02**: Average time per stage across all jobs
- **REPORT-V2-03**: Export any report to CSV

### Access & Collaboration

- **STAFF-01**: Owner can invite staff/technician accounts with limited permissions
- **STAFF-02**: Owner can assign a job to a specific staff member

### Automation

- **AUTO-01**: Automated reminder SMS to customer if job has been Ready for Pickup for more than N days without payment
- **AUTO-02**: Automated check-in SMS to customer if job has had no stage change in more than N days

### Shop Profile

- **PROFILE-01**: Each shop has a public-facing profile page at a unique URL
- **PROFILE-02**: Shop profile displays shop name, logo, contact info, hours, and brand color

---

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Native iOS / Android app | Mobile-first web covers owner use case; native app is 3x scope for marginal gain |
| Customer login / accounts | Token URL portal eliminates auth complexity and friction — intentional design choice |
| Two-way in-app messaging (customer chat) | One-way notifications model is the product; owners call customers directly |
| AI-estimated completion dates | Requires historical data the new app doesn't have; owner sets dates manually for v1 |
| Multi-location / franchise support | One shop per account; adds cross-tenant complexity not needed at launch |
| Full inventory management (SKU/quantity) | Supply alerts only; full inventory is a different product category |
| QuickBooks / accounting integrations | CSV export covers the need; OAuth sync complexity not worth it in v1 |
| Customer reviews / feedback forms | Not core to job tracking; adds a UX surface area not in scope |
| Automated date recalculation when stages slip | Requires modeling stage durations; owner updates dates manually |
| Public shop profile / marketplace directory | Full marketplace listing deferred; simple public profile URL is v2 |
| Email template editor (WYSIWYG) | Well-designed branded templates ship out of the box; no custom editing |
| Employee timetracking | Out of scope for this product |

---

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Pending |
| SHOP-01 | Phase 1 | Complete |
| SHOP-02 | Phase 1 | Pending |
| SHOP-03 | Phase 1 | Pending |
| SHOP-04 | Phase 1 | Complete |
| SHOP-05 | Phase 1 | Pending |
| INTAKE-01 | Phase 2 | Complete |
| INTAKE-02 | Phase 2 | Complete |
| INTAKE-03 | Phase 2 | Complete |
| INTAKE-04 | Phase 2 | Pending |
| INTAKE-05 | Phase 2 | Complete |
| INTAKE-06 | Phase 2 | Complete |
| INTAKE-07 | Phase 2 | Complete |
| INTAKE-08 | Phase 2 | Complete |
| BOARD-01 | Phase 2 | Complete |
| BOARD-02 | Phase 2 | Complete |
| BOARD-03 | Phase 2 | Complete |
| BOARD-04 | Phase 2 | Pending |
| BOARD-05 | Phase 2 | Complete |
| BOARD-06 | Phase 2 | Complete |
| BOARD-07 | Phase 2 | Complete |
| QUEUE-01 | Phase 3 | Complete |
| QUEUE-02 | Phase 3 | Complete |
| QUEUE-03 | Phase 3 | Complete |
| WAIT-01 | Phase 6 | Pending |
| WAIT-02 | Phase 6 | Pending |
| JOB-01 | Phase 3 | Complete |
| JOB-02 | Phase 3 | Complete |
| JOB-03 | Phase 3 | Complete |
| JOB-04 | Phase 3 | Complete |
| JOB-05 | Phase 3 | Complete |
| PORTAL-01 | Phase 4 | Pending |
| PORTAL-02 | Phase 4 | Pending |
| PORTAL-03 | Phase 4 | Pending |
| PORTAL-04 | Phase 4 | Pending |
| PORTAL-05 | Phase 4 | Pending |
| PORTAL-06 | Phase 4 | Pending |
| PORTAL-07 | Phase 4 | Pending |
| PORTAL-08 | Phase 4 | Pending |
| PAY-01 | Phase 5 | Pending |
| PAY-02 | Phase 5 | Pending |
| PAY-03 | Phase 5 | Pending |
| PAY-04 | Phase 5 | Pending |
| PAY-05 | Phase 5 | Pending |
| PAY-06 | Phase 5 | Pending |
| NOTIF-01 | Phase 6 | Pending |
| NOTIF-02 | Phase 6 | Pending |
| NOTIF-03 | Phase 6 | Pending |
| NOTIF-04 | Phase 6 | Pending |
| SEARCH-01 | Phase 3 | Complete |
| SEARCH-02 | Phase 3 | Complete |
| SUPPLY-01 | Phase 7 | Pending |
| SUPPLY-02 | Phase 7 | Pending |
| REPORT-01 | Phase 7 | Pending |
| REPORT-02 | Phase 7 | Pending |
| REPORT-03 | Phase 7 | Pending |
| REPORT-04 | Phase 7 | Pending |
| REPORT-05 | Phase 7 | Pending |
| POST-01 | Phase 7 | Pending |
| POST-02 | Phase 7 | Pending |
| POST-03 | Phase 7 | Pending |
| POST-04 | Phase 7 | Pending |
| POST-05 | Phase 7 | Pending |
| DOC-01 | Phase 7 | Pending |
| SOCIAL-01 | Phase 2 | Complete |
| SOCIAL-02 | Phase 3 | Complete |

**Coverage:**
- v1 requirements: 68 total (note: source file states 67; actual count is 68)
- Mapped to phases: 68
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-01*
*Last updated: 2026-03-01 after roadmap creation — traceability populated across 7 phases*
