-- ============================================================
-- MountTrack Phase 1: Foundation Schema
-- Run in Supabase SQL Editor after project creation
-- ============================================================

-- SHOPS TABLE
-- id = Supabase auth.uid() — one shop per owner account
CREATE TABLE IF NOT EXISTS shops (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_name     TEXT NOT NULL DEFAULT '',
  address       TEXT,
  city          TEXT,
  state         TEXT,
  zip           TEXT,
  phone         TEXT,
  email         TEXT,
  logo_url      TEXT,
  brand_color   TEXT NOT NULL DEFAULT '#6d28d9',
  onboarding_step INTEGER NOT NULL DEFAULT 0,
  stripe_customer_id       TEXT,
  stripe_subscription_id   TEXT,
  subscription_status      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance index
CREATE INDEX IF NOT EXISTS shops_id_idx ON shops (id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER shops_updated_at
  BEFORE UPDATE ON shops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ENABLE RLS
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES — use (SELECT auth.uid()) wrapper for performance
-- The SELECT wrapper caches auth.uid() once per statement (not per row)

CREATE POLICY "shop_select" ON shops
  FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()));

CREATE POLICY "shop_insert" ON shops
  FOR INSERT TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "shop_update" ON shops
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- No DELETE policy — shop records are never deleted in v1

-- ============================================================
-- STORAGE: logos bucket RLS policies
-- Run AFTER creating the 'logos' bucket in Supabase Dashboard
-- Storage > New bucket > name: logos, public: false
-- ============================================================

CREATE POLICY "logos_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'logos' AND
    (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );

CREATE POLICY "logos_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'logos' AND
    (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );

CREATE POLICY "logos_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'logos' AND
    (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );

CREATE POLICY "logos_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'logos' AND
    (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );
