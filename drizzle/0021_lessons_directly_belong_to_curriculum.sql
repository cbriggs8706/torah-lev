ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "course_id" integer;

UPDATE "lessons" AS "l"
SET "course_id" = "u"."course_id"
FROM "units" AS "u"
WHERE "l"."unit_id" = "u"."id"
	AND "l"."course_id" IS NULL;

ALTER TABLE "lessons"
	ALTER COLUMN "course_id" SET NOT NULL;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'lessons_course_id_curriculum_id_fk'
	) THEN
		ALTER TABLE "lessons"
			ADD CONSTRAINT "lessons_course_id_curriculum_id_fk"
			FOREIGN KEY ("course_id") REFERENCES "public"."curriculum"("id")
			ON DELETE cascade
			ON UPDATE no action;
	END IF;
END $$;

ALTER TABLE "lessons"
	ALTER COLUMN "unit_id" DROP NOT NULL;

ALTER TABLE "lessons"
	DROP CONSTRAINT IF EXISTS "lessons_unit_id_units_id_fk";

ALTER TABLE "lessons"
	ADD CONSTRAINT "lessons_unit_id_units_id_fk"
	FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id")
	ON DELETE set null
	ON UPDATE no action;

CREATE INDEX IF NOT EXISTS "idx_lessons_course_id" ON "lessons" USING btree ("course_id");
