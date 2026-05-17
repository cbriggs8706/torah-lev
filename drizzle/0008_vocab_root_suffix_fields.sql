ALTER TABLE "vocab_entries" RENAME COLUMN "person" TO "root_person";
ALTER TABLE "vocab_entries" RENAME COLUMN "gender" TO "root_gender";
ALTER TABLE "vocab_entries" RENAME COLUMN "number" TO "root_number";

ALTER TABLE "vocab_entries"
	ADD COLUMN "suffix_person" text,
	ADD COLUMN "suffix_gender" text,
	ADD COLUMN "suffix_number" text;

UPDATE "vocab_entries"
SET "payload" = (
	("payload" - 'person' - 'gender' - 'number')
	|| CASE
		WHEN COALESCE("payload"->>'person', '') <> ''
			THEN jsonb_build_object('rootPerson', "payload"->>'person')
		ELSE '{}'::jsonb
	END
	|| CASE
		WHEN COALESCE("payload"->>'gender', '') <> ''
			THEN jsonb_build_object('rootGender', "payload"->>'gender')
		ELSE '{}'::jsonb
	END
	|| CASE
		WHEN COALESCE("payload"->>'number', '') <> ''
			THEN jsonb_build_object('rootNumber', "payload"->>'number')
		ELSE '{}'::jsonb
	END
)
WHERE "payload" ? 'person'
	OR "payload" ? 'gender'
	OR "payload" ? 'number';
