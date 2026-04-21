CREATE TABLE "course_lessons" (
	"course_id" uuid NOT NULL,
	"lesson_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "course_lessons_course_id_lesson_id_pk" PRIMARY KEY("course_id","lesson_id")
);
--> statement-breakpoint
INSERT INTO "course_lessons" ("course_id", "lesson_id", "sort_order")
SELECT "course_id", "id", "sort_order"
FROM "lessons"
WHERE "course_id" IS NOT NULL
ON CONFLICT DO NOTHING;
--> statement-breakpoint
ALTER TABLE "course_lessons" ADD CONSTRAINT "course_lessons_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "course_lessons" ADD CONSTRAINT "course_lessons_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "course_lessons_lesson_idx" ON "course_lessons" USING btree ("lesson_id");
--> statement-breakpoint
CREATE INDEX "course_lessons_sort_idx" ON "course_lessons" USING btree ("course_id","sort_order");
--> statement-breakpoint
ALTER TABLE "lessons" DROP CONSTRAINT IF EXISTS "lessons_course_id_courses_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "lessons_course_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "lessons_sort_idx";
--> statement-breakpoint
ALTER TABLE "lessons" DROP COLUMN IF EXISTS "course_id";
--> statement-breakpoint
ALTER TABLE "lessons" DROP COLUMN IF EXISTS "sort_order";
