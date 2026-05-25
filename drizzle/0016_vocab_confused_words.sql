ALTER TABLE "vocab_entries" ADD COLUMN "confused_with" text[];

UPDATE "vocab_entries" AS "source"
SET "synonyms" = COALESCE((
	SELECT array_agg(COALESCE("target"."id"::text, "relation"."value") ORDER BY "relation"."ordinality")
	FROM unnest(COALESCE("source"."synonyms", '{}'::text[])) WITH ORDINALITY AS "relation"("value", "ordinality")
	LEFT JOIN "vocab_entries" AS "target"
		ON "target"."source_key" = "source"."source_key"
		AND "target"."entry_id" = CASE
			WHEN "relation"."value" ~ '^[0-9]+$' THEN "relation"."value"::integer
			ELSE NULL
		END
), '{}'::text[]);

UPDATE "vocab_entries" AS "source"
SET "antonyms" = COALESCE((
	SELECT array_agg(COALESCE("target"."id"::text, "relation"."value") ORDER BY "relation"."ordinality")
	FROM unnest(COALESCE("source"."antonyms", '{}'::text[])) WITH ORDINALITY AS "relation"("value", "ordinality")
	LEFT JOIN "vocab_entries" AS "target"
		ON "target"."source_key" = "source"."source_key"
		AND "target"."entry_id" = CASE
			WHEN "relation"."value" ~ '^[0-9]+$' THEN "relation"."value"::integer
			ELSE NULL
		END
), '{}'::text[]);

DROP INDEX IF EXISTS "uniq_vocab_source_entry";
ALTER TABLE "vocab_entries" DROP COLUMN "entry_id";
