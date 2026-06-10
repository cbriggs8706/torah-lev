CREATE TABLE IF NOT EXISTS "public_course_activity_completion" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"activity_key" text NOT NULL,
	"activity_signature" text NOT NULL,
	"status" text DEFAULT 'completed' NOT NULL,
	"score_percent" integer,
	"points" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp,
	"last_interacted_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
	ALTER TABLE "public_course_activity_completion"
		ADD CONSTRAINT "pc_activity_completion_user_fk"
		FOREIGN KEY ("user_id")
		REFERENCES "public"."user_progress"("user_id")
		ON DELETE cascade
		ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "idx_public_course_activity_completion_user"
	ON "public_course_activity_completion" USING btree ("user_id", "activity_signature");

CREATE UNIQUE INDEX IF NOT EXISTS "uniq_public_course_activity_completion"
	ON "public_course_activity_completion" USING btree ("user_id", "activity_signature");
