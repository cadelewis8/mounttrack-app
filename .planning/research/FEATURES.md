# Feature Landscape

**Domain:** Multi-tenant taxidermy shop management SaaS (trade-shop job-tracking)
**Researched:** 2026-03-01
**Confidence note:** External research tools unavailable this session. Analysis is derived from PROJECT.md context combined with training-data knowledge of trade-shop SaaS (auto repair, repair shop, tattoo shop, custom fabrication, pet grooming management software), customer portal UX patterns, Kanban SaaS, and mobile-first dashboard design. Confidence: MEDIUM (training data, no live source verification this session).

---

## Table Stakes

Features users expect from any job-tracking shop management tool. Missing = product feels unfinished or owners abandon during trial.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Job intake form (customer + job details) | Every shop needs a place to record a job when a customer drops off work | Low | Name, phone, animal type, mount style, price, deposit |
| Unique job number per job | Owners reference jobs by number when talking to customers; prevents confusion | Low | Auto-increment or formatted (e.g., `2026-0042`) |
| Job status / stage tracking | Core reason to use software over a whiteboard | Medium | Kanban board or list — at minimum a status field |
| Edit job details after intake | Prices change, dates slip, details are corrected | Low | Any field must be editable post-intake |
| Overdue job flagging | Owners need to immediately see what's late | Low | Compare estimated completion date to today |
| Search and filter jobs | Shop with 80+ active jobs cannot scroll to find one | Low | By name, job number, status, animal type at minimum |
| Customer contact info on job | Owner needs to call or text a customer without leaving the app | Low | Phone + email stored on job record |
| Deposit vs. balance tracking | Every shop collects a deposit; owner needs to know what's owed | Medium | Requires payment ledger per job |
| Revenue reporting (basic) | Owner needs to know monthly income — even a simple number | Medium | Monthly totals, outstanding balances |
| Mobile-usable UI | Shop owners work on the floor with a phone | High | Not a native app, but must be genuinely usable on a phone |
| Photo attachment per job | Visual record of what was brought in, condition on arrival, progress | Medium | Upload + view photos on the job record |
| Notification when job is ready | Customer must be told when to come pick up — phone tag is the status quo pain | Medium | SMS or email at minimum |

---

## Differentiators

Features that set MountTrack apart from a generic spreadsheet or a generic shop-management tool. These are the reasons an owner pays monthly instead of using a whiteboard.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Branded customer portal (no-login, token URL) | Customer self-serves without calling the shop — reduces phone calls significantly | High | Token in URL, mobile-first timeline UI, no account required |
| Visual Kanban stage board with drag-and-drop | Stages are the natural mental model for taxidermy production; drag feels fast vs. dropdowns | High | Custom stages per shop; drag-and-drop on mobile is hard to get right |
| Auto-branded SMS + email on every stage change | Customers get proactive updates without owner doing anything extra | High | Twilio + Resend; shop name/logo in all communications, not MountTrack branding |
| Customizable production stages per shop | Every shop has a slightly different workflow (some do in-house tanning, some don't) | Medium | Add, rename, reorder stages; sensible defaults ship out of the box |
| Customer pays on the portal (Stripe) | Eliminates "come in to pay" friction; owner collects money faster | High | Stripe Payment Intents on portal; partial payments supported |
| Waitlist / pre-intake flow | Captures customers before they're formally booked; reduces no-shows | Medium | Customer gets SMS confirmation they're on the list |
| Rush job visual flag on board | High-value jobs or promised deadlines need to stand out at a glance | Low | Flag icon / color on Kanban card |
| Bulk stage move | Shops batch-process jobs (e.g., 12 deer come out of the tanning drum together) | Medium | Multi-select on board, move all selected to next stage |
| Progress photo gallery on customer portal | Customers love seeing their mount in progress; differentiates from competitors who give zero visibility | Medium | Owner uploads photos; customer views full-screen on portal |
| Referral source tracking at intake | Owner knows whether Facebook ads, word-of-mouth, or Google is driving business | Low | Simple dropdown at intake; feeds referral report |
| Queue / backlog view with capacity indicators | Prevents owner from over-promising dates by showing total shop load | Medium | List of all active jobs sorted by estimated date, volume by stage |
| Calendar view of estimated completion dates | Spot-checks overcommitment; owner can see if 30 jobs are all due the same week | Medium | Read-only calendar; dates set by owner, not AI |
| Supply alert system | Running out of a specific form size mid-job is a real operational problem | Low-Medium | Owner flags low stock; surfaces as dashboard reminder |
| Per-job communication history | Owner can see exactly what was sent to a customer and when, resolving disputes | Low | Log of all SMS + email sent from the job |
| Auto payment link on "Ready for Pickup" | Zero-friction trigger for the payment request; owner doesn't have to remember | Medium | Stage change triggers payment link SMS/email |

---

## Anti-Features

Features to deliberately NOT build in v1. Each costs time and complexity without proportionate return at this stage.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Native iOS / Android app | Cost is 2-3x development time; PWA with mobile-first web covers 90% of the owner's use case | Build genuinely mobile-first responsive web; use PWA manifest for home screen install |
| Customer login / accounts | Adds auth complexity, password resets, account management; kills the "just click the link" UX | Token-in-URL portal; no session, no account, no friction |
| Two-way in-app messaging (chat) | Feels essential but is a product in itself; most shop owners just call customers | Send SMS/email outbound; owner replies via their normal phone number |
| AI-estimated completion dates | Sounds impressive but requires historical data the new app doesn't have; owners distrust it | Owner sets dates manually; AI dates can be a v3 feature after data accumulates |
| Multi-location / franchise support | Rare need for v1 customer segment; adds cross-tenant query complexity | One shop per account; revisit after product-market fit |
| Inventory management (full) | Full inventory is a separate product category; scope creep risk | Supply alerts only (low-stock flags) — not a SKU/quantity tracking system |
| QuickBooks / accounting integration | Complex OAuth, sync bugs, edge cases; most small shop owners don't use accounting software daily | Provide revenue reports exportable to CSV for manual input |
| Customer-facing review / feedback form | Nice to have but adds a whole UX surface area; not the core pain | Defer to v2; focus on job tracking first |
| Automated date-recalculation when stages slip | Requires modeling stage durations, historical averages — premature | Owner manually updates estimated date; build the habit first |
| Public shop profile / marketplace listing | Makes MountTrack a marketplace, not a tool — different business entirely | Out of scope entirely |
| Employee/technician assignment per job | Most taxidermy shops are 1-2 people; role complexity hurts the simple UX | Single-owner model for v1; multi-user can come later |
| Email template editor (WYSIWYG) | Complex to build, hard to get right; owners want it to "just work" | Provide well-designed branded templates with logo + color; no custom editing |
| Recurring/subscription jobs | Not a taxidermy shop pattern | N/A — not applicable to this domain |

---

## Feature Dependencies

```
Job Intake Form
  └─► Job Record exists
        ├─► Kanban Board (jobs must exist to display)
        ├─► Customer Portal (job record holds token)
        │     ├─► Progress Photos on Portal (photos attached to job)
        │     └─► Customer Payment on Portal (requires Stripe + job balance)
        ├─► Stage Change Notifications (requires job + stage + customer contact)
        │     └─► Auto Payment Link (triggered by specific stage change)
        ├─► Communication History (log of notifications sent)
        ├─► Supply Alerts (surfaced on dashboard — needs job data to contextualize)
        └─► Reports (aggregate job data)

Customizable Stages
  └─► Kanban Board (board columns = stages)
        └─► Bulk Stage Move (multi-select on the board)
              └─► Stage Change Notifications (fires per job in the bulk move)

Shop Branding (logo + color)
  └─► Customer Portal (renders shop brand)
        └─► Stage Change Notifications (SMS/email use shop branding)

Stripe Integration (subscription billing — shop owner)
  └─► Shop Onboarding (owner pays monthly subscription)

Stripe Integration (payment intents — customer)
  └─► Customer Payment on Portal
        └─► Deposit vs. Balance Tracking (records partial payments against job balance)

Waitlist
  └─► Waitlist SMS (sends confirmation — requires Twilio)
  [Waitlist is pre-intake; does NOT depend on Job Record]

Referral Source (intake field)
  └─► Referral Source Report (aggregate referral data)

Calendar View
  └─► Estimated Completion Date (set on job record at intake or updated)
        └─► Overdue Flagging (compare estimated date to today)
              └─► Queue / Backlog View (uses same date field)
```

---

## Taxidermy-Specific Patterns

These are domain details that generic shop-management software doesn't address but that taxidermy shop owners will expect.

| Pattern | Why It Matters | Feature Implication |
|---------|---------------|---------------------|
| Jobs measured in months, not days | A deer shoulder mount takes 3-6 months; overdue calculation must handle long timelines without false positives | Estimated completion dates are month-level; overdue flag only after date passes, not approaching |
| Seasonal intake spikes | Deer season (Oct-Dec) floods shops with 60-100 new jobs in 8 weeks; interface must handle bulk intake and large boards | Performance on boards with 100+ cards; bulk intake flow |
| Multiple animal types per shop | A shop may handle deer, fish, turkey, bear, birds — each has different production stages | Animal type selector with predefined list + custom type support |
| Deposit is non-negotiable norm | Virtually all taxidermists require a deposit at drop-off | Deposit field is required at intake, not optional |
| Customers go months without contact | Unlike a car repair (days), a taxidermy customer may go 4 months without hearing anything | Proactive stage notifications are high-value: owner doesn't have to proactively call, customer isn't anxiously wondering |
| Pickup scheduling is manual | Most shops don't book pickup appointments; customer just comes in when ready | "Ready for Pickup" stage + payment link is the trigger; no appointment booking needed in v1 |
| Form/eye supply runs per species | Taxidermists order forms and glass eyes per species/size; running out is a common delay cause | Supply alert system scoped to "form sizes" and "eye types" — not generic inventory |

---

## Customer Portal (No-Login) Patterns

Research on established no-login portal UX from comparable domains (repair shops, print shops, custom order businesses).

| Pattern | Standard Practice | MountTrack Implementation |
|---------|------------------|--------------------------|
| Token in URL | Unique token embedded in URL path or query param; no session cookie required | Token in URL path (e.g., `/portal/[token]`) |
| Persistent link | Link sent at job creation stays valid for the job's lifetime | Token never rotates; same link used throughout job lifecycle |
| Mobile-first layout | Portals are opened on phones; desktop is secondary | Single-column layout, large touch targets, no horizontal scroll |
| Progress timeline (vertical) | Visual stage timeline showing completed, current, and upcoming stages | Vertical stepper component; current stage highlighted |
| Minimal information surface | Show what the customer cares about: status, date, photos, balance — nothing else | No internal notes, no job number details, no owner-facing data |
| Full-screen photo viewer | Progress photos are the most engaging element; tapping should open full-screen | Tap-to-expand photo gallery |
| Inline payment (no redirect) | Stripe Payment Element embedded on the portal page; avoid leaving the portal | Stripe Payment Element on portal; not a redirect to Stripe-hosted page |
| Partial payment support | Customer may want to make multiple payments over the job duration | Amount input field + current balance displayed |
| Branded, not generic | Portal reflects the shop, not the platform — builds trust with the end customer | Shop logo, name, and brand color on portal; no MountTrack branding visible to customer |

---

## Kanban Board Patterns (Small Business)

Patterns from established small-business Kanban implementations (Trello, Jobber, ServiceTitan lite, custom shop tools).

| Pattern | Why It Works | Notes |
|---------|-------------|-------|
| Column per stage | Natural mental model; matches whiteboard many shops already use | Columns = stages; customizable |
| Card = job | Each card shows job number, customer name, animal type, estimated date, rush flag | Dense but readable on 5" phone screen is the hard part |
| Drag-and-drop stage move | Fastest single-job transition; satisfying and fast | On mobile, long-press to drag or tap-to-select + move button is safer than pure drag |
| Overdue cards visually distinct | Red border or background on overdue cards; immediately visible | Compare estimated date to today server-side; pass flag to card |
| Rush flag icon on card | Star, flame, or bolt icon on card; not a color (color is already used for overdue) | Simple boolean on job record |
| Horizontal scroll for columns | Boards with 6+ columns overflow the screen | Native horizontal scroll on mobile; don't collapse columns |
| Board header job count per column | "Mounting (14)" tells owner at a glance where bottlenecks are | Aggregate count per stage |
| Bulk select + move | Multi-select via checkbox or long-press; then "Move to [stage]" action | Required for batch processing common in taxidermy |
| Archive / complete lane | Finished jobs should leave the board but remain searchable | "Completed" status removes from board; jobs remain in database and search |

---

## Mobile-First Owner Dashboard Patterns

| Pattern | Why It Matters | Implementation Note |
|---------|---------------|---------------------|
| Key metrics above the fold | On a phone, the first screen is all the owner sees; surface the most important numbers | Outstanding balance total, overdue job count, jobs ready for pickup |
| Large touch targets (min 44px) | Shop owners may be wearing gloves or have dirty hands | Minimum 44x44px touch targets; generous padding on buttons |
| Bottom navigation bar | Thumb-reachable navigation; top nav requires reach | Bottom nav: Board, Queue, Jobs, Reports |
| Minimal modals, prefer full-screen routes | Modals are hard to use on small screens | Navigate to detail pages, not slide-over panels |
| Camera capture for photos | Owner needs to photograph a fresh mount immediately | `<input accept="image/*" capture="environment">` for direct camera access |
| Offline-tolerant reads | Shop may have poor cell coverage in a rural location | Consider caching board state for reads; writes can require connectivity |
| Dark mode support | Owner may be working in low light (processing room, walk-in cooler) | System preference detection + manual toggle |
| No horizontal scroll on main views | Accidental horizontal scroll ruins UX on mobile | Kanban board is the exception and needs explicit affordance |

---

## MVP Recommendation

The minimum product that delivers the core value proposition — "intake a job, drag it through stages, customer is automatically kept informed and can pay":

**Prioritize for v1:**
1. Job intake form with all required fields (customer, animal, price, deposit)
2. Kanban stage board with drag-and-drop and default stages
3. Customer portal (token URL, timeline, photos, balance, Stripe payment)
4. Auto-branded SMS + email on stage change (Twilio + Resend)
5. Overdue flagging and rush flag on board
6. Search and filter jobs
7. Deposit vs. balance tracking per job
8. Basic revenue + outstanding balance reports
9. Mobile-first UI throughout (board, job detail, portal)

**Defer to v2 (post-validation):**
- Waitlist / pre-intake flow (valuable but not core job-tracking)
- Calendar view (queue view covers the immediate pain)
- Supply alerts (nice to have; doesn't block the core workflow)
- Bulk stage move (saves time but single-move works for validation)
- Referral source reporting (requires data accumulation)
- Dark mode (correctness over polish in v1)

**Defer to v3+:**
- Multi-user / employee assignment
- AI completion date estimates
- Accounting integrations
- Customer feedback / reviews

---

## Sources

- Project context: `.planning/PROJECT.md` (HIGH confidence — primary source)
- Trade-shop SaaS patterns: Training data from Jobber, ServiceTitan, RepairShopr, Shopmonkey, Ordoro, Joist, HouseCall Pro feature analysis (MEDIUM confidence — training data, not live-verified this session)
- No-login portal patterns: Training data from order tracking (Shopify, custom print shops, tattoo shop booking tools) (MEDIUM confidence)
- Kanban small-business patterns: Training data from Trello, monday.com, Linear, Asana, and purpose-built trade-shop Kanban tools (MEDIUM confidence)
- Mobile dashboard patterns: Training data from Jobber mobile, HouseCall Pro, ServiceTitan mobile UX guidelines (MEDIUM confidence)
- Taxidermy-specific patterns: Domain knowledge from publicly available taxidermy shop discussions, software reviews on forums (LOW-MEDIUM confidence — niche domain, limited training data depth)

**Note:** External research tools (WebSearch, WebFetch) were unavailable during this session. All findings above MEDIUM confidence should be verified against live competitor analysis before roadmap finalization. Recommended verification targets: TaxiTracker, Taxidermy Business Management (TBM), and generic small-business job-tracking tools like Jobber and RepairDesk.
