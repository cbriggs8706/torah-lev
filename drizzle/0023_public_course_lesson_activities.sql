CREATE TABLE IF NOT EXISTS "public_course_lesson_activity" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_course_lesson_id" integer NOT NULL,
	"activity_key" text NOT NULL,
	"order" integer NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"is_required" boolean DEFAULT false NOT NULL,
	"filter_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public_course_enrollment_activity_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"enrollment_id" integer NOT NULL,
	"public_course_lesson_id" integer NOT NULL,
	"public_course_lesson_activity_id" integer NOT NULL,
	"status" text DEFAULT 'not_started' NOT NULL,
	"score_percent" integer,
	"completed_at" timestamp,
	"last_interacted_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
	ALTER TABLE "public_course_lesson_activity"
		ADD CONSTRAINT "pc_lesson_activity_lesson_fk"
		FOREIGN KEY ("public_course_lesson_id")
		REFERENCES "public"."public_course_lesson"("id")
		ON DELETE cascade
		ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
	ALTER TABLE "public_course_enrollment_activity_progress"
		ADD CONSTRAINT "pc_activity_progress_enrollment_fk"
		FOREIGN KEY ("enrollment_id")
		REFERENCES "public"."public_course_enrollment"("id")
		ON DELETE cascade
		ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
	ALTER TABLE "public_course_enrollment_activity_progress"
		ADD CONSTRAINT "pc_activity_progress_lesson_fk"
		FOREIGN KEY ("public_course_lesson_id")
		REFERENCES "public"."public_course_lesson"("id")
		ON DELETE cascade
		ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
	ALTER TABLE "public_course_enrollment_activity_progress"
		ADD CONSTRAINT "pc_activity_progress_activity_fk"
		FOREIGN KEY ("public_course_lesson_activity_id")
		REFERENCES "public"."public_course_lesson_activity"("id")
		ON DELETE cascade
		ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "idx_public_course_lesson_activity_lesson"
	ON "public_course_lesson_activity" USING btree ("public_course_lesson_id");

CREATE UNIQUE INDEX IF NOT EXISTS "idx_public_course_lesson_activity_order"
	ON "public_course_lesson_activity" USING btree ("public_course_lesson_id", "order");

CREATE UNIQUE INDEX IF NOT EXISTS "idx_public_course_lesson_activity_key"
	ON "public_course_lesson_activity" USING btree ("public_course_lesson_id", "activity_key");

CREATE INDEX IF NOT EXISTS "idx_public_course_activity_progress_enrollment"
	ON "public_course_enrollment_activity_progress" USING btree ("enrollment_id");

CREATE INDEX IF NOT EXISTS "idx_public_course_activity_progress_lesson"
	ON "public_course_enrollment_activity_progress" USING btree ("public_course_lesson_id");

CREATE UNIQUE INDEX IF NOT EXISTS "idx_public_course_activity_progress_unique"
	ON "public_course_enrollment_activity_progress" USING btree ("enrollment_id", "public_course_lesson_activity_id");
