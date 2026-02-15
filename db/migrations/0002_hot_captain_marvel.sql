ALTER TABLE "lessons" ADD COLUMN "lesson_group_number" integer;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "lesson_variant" text DEFAULT '' NOT NULL;