ALTER TYPE "video_type" ADD VALUE IF NOT EXISTS 'scripture';

ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "scripture_book" text;
ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "scripture_chapter" integer;
ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "scripture_verses" text;
