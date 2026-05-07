ALTER TABLE "vocab_entries" ADD COLUMN "absolute_entry_id" integer;
--> statement-breakpoint
ALTER TABLE "vocab_entries" ADD CONSTRAINT "vocab_entries_absolute_entry_id_vocab_entries_id_fk" FOREIGN KEY ("absolute_entry_id") REFERENCES "public"."vocab_entries"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_vocab_absolute_entry_id" ON "vocab_entries" USING btree ("absolute_entry_id");
