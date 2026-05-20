ALTER TABLE "study_group_course"
ADD COLUMN IF NOT EXISTS "start_date" timestamp;
--> statement-breakpoint
ALTER TABLE "study_group_course"
ADD COLUMN IF NOT EXISTS "end_date" timestamp;
