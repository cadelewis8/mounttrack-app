-- Migration: 0005_payments_table.sql
-- Records confirmed Stripe payment events for customer job payments.
-- Only inserted from webhook (checkout.session.completed) — never pending entries.
-- stripe_session_id UNIQUE enforces idempotency against webhook retries.
-- shop_id on the row enables efficient dashboard SUM without joining through jobs.

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  stripe_session_id TEXT NOT NULL UNIQUE,
  stripe_payment_intent_id TEXT,
  amount_cents INTEGER NOT NULL,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shop_isolation" ON payments
  FOR ALL
  USING (shop_id = auth.uid());

CREATE INDEX payments_job_id_idx ON payments (job_id);
CREATE INDEX payments_shop_id_idx ON payments (shop_id);
