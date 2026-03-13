-- Migration: create job_photos table
-- Replaces flat photo_paths[] on jobs with a proper join table that records
-- which stage the job was in when each photo was uploaded.

CREATE TABLE job_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  stage_id UUID REFERENCES stages(id) ON DELETE SET NULL,
  path TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE job_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shop_isolation" ON job_photos
  FOR ALL
  USING (shop_id = auth.uid());

CREATE INDEX job_photos_job_id_idx ON job_photos (job_id);

-- Migrate existing photos from photo_paths array, attaching current stage
INSERT INTO job_photos (shop_id, job_id, stage_id, path)
SELECT j.shop_id, j.id, j.stage_id, unnest(j.photo_paths)
FROM jobs j
WHERE j.photo_paths IS NOT NULL AND array_length(j.photo_paths, 1) > 0;
