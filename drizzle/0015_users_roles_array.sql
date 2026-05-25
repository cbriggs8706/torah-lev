ALTER TABLE "users"
ADD COLUMN "roles" text[] NOT NULL DEFAULT ARRAY['user']::text[];

UPDATE "users"
SET "roles" = CASE
	WHEN "role" IS NULL OR btrim("role") = '' OR "role" = 'user' THEN ARRAY['user']::text[]
	ELSE ARRAY['user', "role"]::text[]
END;

ALTER TABLE "users"
DROP COLUMN "role";
