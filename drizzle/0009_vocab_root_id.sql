ALTER TABLE "vocab_entries" RENAME COLUMN "absolute_entry_id" TO "root_id";

ALTER TABLE "vocab_entries"
	RENAME CONSTRAINT "vocab_entries_absolute_entry_id_vocab_entries_id_fk"
	TO "vocab_entries_root_id_vocab_entries_id_fk";

ALTER INDEX "idx_vocab_absolute_entry_id" RENAME TO "idx_vocab_root_id";

UPDATE "vocab_entries"
SET "payload" = (
	("payload" - 'absoluteEntryId')
	|| CASE
		WHEN "payload" ? 'absoluteEntryId'
			THEN jsonb_build_object('rootId', "payload"->'absoluteEntryId')
		ELSE '{}'::jsonb
	END
)
WHERE "payload" ? 'absoluteEntryId';
