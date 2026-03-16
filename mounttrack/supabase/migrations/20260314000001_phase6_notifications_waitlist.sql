-- Phase 6: Notifications & Waitlist schema additions
-- Adds sms_opted_out to jobs, creates notifications and waitlist tables with RLS

-- 1. Add sms_opted_out to jobs table
ALTER TABLE jobs ADD COLUMN sms_opted_out BOOLEAN NOT NULL DEFAULT false;

-- 2. Create notifications table
-- job_id is nullable because waitlist_confirm notifications have no associated job yet
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id     UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  job_id      UUID REFERENCES jobs(id) ON DELETE CASCADE,
  channel     TEXT NOT NULL CHECK (channel IN ('sms', 'email')),
  type        TEXT NOT NULL CHECK (type IN ('stage_update', 'payment_request', 'waitlist_confirm')),
  stage_name  TEXT,
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shop_owner_notifications" ON notifications
  FOR ALL USING (shop_id = auth.uid());

-- 3. Create waitlist table
CREATE TABLE waitlist (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id     UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  animal_type TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shop_owner_waitlist" ON waitlist
  FOR ALL USING (shop_id = auth.uid());
