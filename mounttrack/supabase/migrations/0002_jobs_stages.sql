-- Migration: 0002_jobs_stages.sql
-- Phase 2: Job Intake & Board
-- Creates: stages, job_number_seq, jobs tables + RLS + triggers + storage policies
-- Depends on: 0001_initial_schema.sql (shops table, update_updated_at function)

-- ============================================================
-- STAGES TABLE
-- Kanban columns — seeded automatically when a shop is created
-- ============================================================

CREATE TABLE stages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id     UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  position    INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX stages_shop_id_idx ON stages (shop_id);

CREATE TRIGGER stages_updated_at
  BEFORE UPDATE ON stages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stages_select" ON stages FOR SELECT TO authenticated
  USING (shop_id = (SELECT auth.uid()));
CREATE POLICY "stages_insert" ON stages FOR INSERT TO authenticated
  WITH CHECK (shop_id = (SELECT auth.uid()));
CREATE POLICY "stages_update" ON stages FOR UPDATE TO authenticated
  USING (shop_id = (SELECT auth.uid())) WITH CHECK (shop_id = (SELECT auth.uid()));
CREATE POLICY "stages_delete" ON stages FOR DELETE TO authenticated
  USING (shop_id = (SELECT auth.uid()));

-- ============================================================
-- JOB_NUMBER_SEQ TABLE + GAPLESS COUNTER FUNCTION
-- Atomic per-shop integer sequence (no gaps, no race conditions)
-- ============================================================

CREATE TABLE job_number_seq (
  shop_id     UUID PRIMARY KEY REFERENCES shops(id) ON DELETE CASCADE,
  last_number INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE job_number_seq ENABLE ROW LEVEL SECURITY;

CREATE POLICY "seq_select" ON job_number_seq FOR SELECT TO authenticated
  USING (shop_id = (SELECT auth.uid()));

-- SECURITY DEFINER runs as the function owner (postgres), bypassing RLS on job_number_seq insert
-- This is intentional: the counter must be writable without the shop's RLS insert policy
CREATE OR REPLACE FUNCTION get_next_job_number(p_shop_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_number INTEGER;
BEGIN
  INSERT INTO job_number_seq (shop_id, last_number)
    VALUES (p_shop_id, 1)
    ON CONFLICT (shop_id)
    DO UPDATE SET last_number = job_number_seq.last_number + 1
    RETURNING last_number INTO v_number;
  RETURN v_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- JOBS TABLE
-- Core intake record — one row per customer job
-- ============================================================

CREATE TABLE jobs (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id                   UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  job_number                INTEGER NOT NULL,
  stage_id                  UUID REFERENCES stages(id) ON DELETE RESTRICT,
  customer_name             TEXT NOT NULL,
  customer_phone            TEXT,
  customer_email            TEXT,
  animal_type               TEXT NOT NULL,
  mount_style               TEXT NOT NULL,
  quoted_price              NUMERIC(10,2) NOT NULL,
  deposit_amount            NUMERIC(10,2),
  estimated_completion_date DATE NOT NULL,
  referral_source           TEXT,
  is_rush                   BOOLEAN NOT NULL DEFAULT FALSE,
  social_media_consent      BOOLEAN NOT NULL DEFAULT FALSE,
  photo_paths               TEXT[] DEFAULT '{}',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (shop_id, job_number)
);

CREATE INDEX jobs_shop_id_idx ON jobs (shop_id);
CREATE INDEX jobs_stage_id_idx ON jobs (stage_id);

CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jobs_select" ON jobs FOR SELECT TO authenticated
  USING (shop_id = (SELECT auth.uid()));
CREATE POLICY "jobs_insert" ON jobs FOR INSERT TO authenticated
  WITH CHECK (shop_id = (SELECT auth.uid()));
CREATE POLICY "jobs_update" ON jobs FOR UPDATE TO authenticated
  USING (shop_id = (SELECT auth.uid())) WITH CHECK (shop_id = (SELECT auth.uid()));
CREATE POLICY "jobs_delete" ON jobs FOR DELETE TO authenticated
  USING (shop_id = (SELECT auth.uid()));

-- ============================================================
-- DEFAULT STAGE SEEDING TRIGGER
-- Fires AFTER INSERT on shops — seeds 6 default stages atomically
-- with shop creation so every new shop has a full Kanban board
-- ============================================================

CREATE OR REPLACE FUNCTION seed_default_stages()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO stages (shop_id, name, position) VALUES
    (NEW.id, 'Skinning',          0),
    (NEW.id, 'Fleshing',          1),
    (NEW.id, 'Tanning',           2),
    (NEW.id, 'Mounting',          3),
    (NEW.id, 'Finishing',         4),
    (NEW.id, 'Ready for Pickup',  5);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER shops_seed_stages
  AFTER INSERT ON shops
  FOR EACH ROW EXECUTE FUNCTION seed_default_stages();

-- ============================================================
-- STORAGE: job-photos bucket RLS policies
-- NOTE: Executor must create 'job-photos' bucket manually in Supabase Dashboard as a PRIVATE bucket
-- Then run these policies:
-- Storage > New bucket > name: job-photos, public: false
-- ============================================================

CREATE POLICY "photos_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'job-photos' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));
CREATE POLICY "photos_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'job-photos' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));
CREATE POLICY "photos_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'job-photos' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));
