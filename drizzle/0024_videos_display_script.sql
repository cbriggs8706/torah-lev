ALTER TABLE "videos"
ADD COLUMN IF NOT EXISTS "display_script" boolean NOT NULL DEFAULT true;
