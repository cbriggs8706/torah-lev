CREATE TABLE IF NOT EXISTS "study_group_course" (
	"id" serial PRIMARY KEY NOT NULL,
	"study_group_id" integer NOT NULL,
	"name" text NOT NULL,
	"image_url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "study_group_course"
 ADD CONSTRAINT "study_group_course_study_group_id_study_groups_id_fk"
 FOREIGN KEY ("study_group_id")
 REFERENCES "public"."study_groups"("id")
 ON DELETE cascade
 ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_study_group_course_group"
ON "study_group_course" ("study_group_id");
