CREATE INDEX IF NOT EXISTS "idx_vocab_lessons_gin"
	ON "vocab_entries" USING gin ("lessons");

CREATE INDEX IF NOT EXISTS "idx_vocab_source_type"
	ON "vocab_entries" USING btree ("source_key", "type");

CREATE INDEX IF NOT EXISTS "idx_vocab_source_category"
	ON "vocab_entries" USING btree ("source_key", "category");
