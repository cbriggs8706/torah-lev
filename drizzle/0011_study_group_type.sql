DO $$ BEGIN
 CREATE TYPE "public"."study_group_type" AS ENUM('Public', 'Private', 'Self-paced');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "study_groups"
ADD COLUMN IF NOT EXISTS "group_type" "study_group_type" DEFAULT 'Public' NOT NULL;
