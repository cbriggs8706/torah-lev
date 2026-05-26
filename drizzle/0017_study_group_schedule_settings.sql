ALTER TABLE "study_group_schedule"
ADD COLUMN IF NOT EXISTS "study_group_course_id" integer;
--> statement-breakpoint
ALTER TABLE "study_group_schedule"
ADD COLUMN IF NOT EXISTS "title" text;
--> statement-breakpoint
ALTER TABLE "study_group_schedule"
ADD CONSTRAINT "study_group_schedule_study_group_course_id_study_group_course_id_fk"
FOREIGN KEY ("study_group_course_id") REFERENCES "public"."study_group_course"("id")
ON DELETE set null ON UPDATE no action;
