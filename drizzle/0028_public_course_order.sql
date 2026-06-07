ALTER TABLE "public_course"
	ADD COLUMN IF NOT EXISTS "order" integer;

CREATE INDEX IF NOT EXISTS "idx_public_course_order" ON "public_course" USING btree ("order");
