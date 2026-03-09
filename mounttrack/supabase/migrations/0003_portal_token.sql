-- Migration: add portal_token to jobs table
-- Each job gets a unique UUID token used as the credential for the customer portal.
-- gen_random_uuid() is built-in to PostgreSQL 13+ (pgcrypto extension not required).

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS portal_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE;

-- Index for fast token lookups on every portal page load
CREATE INDEX IF NOT EXISTS jobs_portal_token_idx ON jobs (portal_token);

-- Backfill any existing rows that somehow got NULL (shouldn't happen with NOT NULL DEFAULT,
-- but guards against edge cases in partial migrations)
UPDATE jobs SET portal_token = gen_random_uuid() WHERE portal_token IS NULL;
