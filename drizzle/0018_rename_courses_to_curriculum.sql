DO $$
BEGIN
	IF to_regclass('public.courses') IS NOT NULL
	AND to_regclass('public.curriculum') IS NULL THEN
		ALTER TABLE "courses" RENAME TO "curriculum";
	END IF;
END $$;
