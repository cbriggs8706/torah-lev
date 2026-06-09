ALTER TABLE "public_course"
	ADD COLUMN IF NOT EXISTS "curriculum_id" integer;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'public_course_curriculum_id_curriculum_id_fk'
	) THEN
		ALTER TABLE "public_course"
			ADD CONSTRAINT "public_course_curriculum_id_curriculum_id_fk"
			FOREIGN KEY ("curriculum_id") REFERENCES "public"."curriculum"("id")
			ON DELETE set null ON UPDATE no action;
	END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_public_course_curriculum" ON "public_course" USING btree ("curriculum_id");
