CREATE TABLE IF NOT EXISTS "public_course" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"image_url" text NOT NULL,
	"proficiency_level" text,
	"ending_proficiency_level" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public_course_lesson" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_course_id" integer NOT NULL,
	"platform_course_id" integer NOT NULL,
	"lesson_id" integer NOT NULL,
	"order" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public_course_enrollment" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_course_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"goal_days" integer NOT NULL,
	"start_date" timestamp NOT NULL,
	"target_end_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public_course_enrollment_lesson" (
	"id" serial PRIMARY KEY NOT NULL,
	"enrollment_id" integer NOT NULL,
	"public_course_lesson_id" integer NOT NULL,
	"order" integer NOT NULL,
	"scheduled_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'public_course_lesson_public_course_id_public_course_id_fk'
	) THEN
		ALTER TABLE "public_course_lesson"
			ADD CONSTRAINT "public_course_lesson_public_course_id_public_course_id_fk"
			FOREIGN KEY ("public_course_id") REFERENCES "public"."public_course"("id")
			ON DELETE cascade ON UPDATE no action;
	END IF;

	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'public_course_lesson_platform_course_id_curriculum_id_fk'
	) THEN
		ALTER TABLE "public_course_lesson"
			ADD CONSTRAINT "public_course_lesson_platform_course_id_curriculum_id_fk"
			FOREIGN KEY ("platform_course_id") REFERENCES "public"."curriculum"("id")
			ON DELETE cascade ON UPDATE no action;
	END IF;

	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'public_course_lesson_lesson_id_lessons_id_fk'
	) THEN
		ALTER TABLE "public_course_lesson"
			ADD CONSTRAINT "public_course_lesson_lesson_id_lessons_id_fk"
			FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id")
			ON DELETE cascade ON UPDATE no action;
	END IF;

	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'public_course_enrollment_public_course_id_public_course_id_fk'
	) THEN
		ALTER TABLE "public_course_enrollment"
			ADD CONSTRAINT "public_course_enrollment_public_course_id_public_course_id_fk"
			FOREIGN KEY ("public_course_id") REFERENCES "public"."public_course"("id")
			ON DELETE cascade ON UPDATE no action;
	END IF;

	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'public_course_enrollment_user_id_user_progress_user_id_fk'
	) THEN
		ALTER TABLE "public_course_enrollment"
			ADD CONSTRAINT "public_course_enrollment_user_id_user_progress_user_id_fk"
			FOREIGN KEY ("user_id") REFERENCES "public"."user_progress"("user_id")
			ON DELETE cascade ON UPDATE no action;
	END IF;

	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'public_course_enrollment_lesson_enrollment_id_public_course_enrollment_id_fk'
	) THEN
		ALTER TABLE "public_course_enrollment_lesson"
			ADD CONSTRAINT "public_course_enrollment_lesson_enrollment_id_public_course_enrollment_id_fk"
			FOREIGN KEY ("enrollment_id") REFERENCES "public"."public_course_enrollment"("id")
			ON DELETE cascade ON UPDATE no action;
	END IF;

	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'public_course_enrollment_lesson_public_course_lesson_id_public_course_lesson_id_fk'
	) THEN
		ALTER TABLE "public_course_enrollment_lesson"
			ADD CONSTRAINT "public_course_enrollment_lesson_public_course_lesson_id_public_course_lesson_id_fk"
			FOREIGN KEY ("public_course_lesson_id") REFERENCES "public"."public_course_lesson"("id")
			ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_public_course_name" ON "public_course" USING btree ("name");
CREATE INDEX IF NOT EXISTS "idx_public_course_lesson_course" ON "public_course_lesson" USING btree ("public_course_id");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_public_course_lesson_order" ON "public_course_lesson" USING btree ("public_course_id", "order");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_public_course_enrollment_user_course" ON "public_course_enrollment" USING btree ("public_course_id", "user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_public_course_enrollment_lesson_unique" ON "public_course_enrollment_lesson" USING btree ("enrollment_id", "public_course_lesson_id");

