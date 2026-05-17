ALTER TABLE "vocab_entries" RENAME COLUMN "heb_niqqud" TO "lemma";
ALTER TABLE "vocab_entries" RENAME COLUMN "eng" TO "gloss";
ALTER TABLE "vocab_entries" RENAME COLUMN "eng_definition" TO "heb_definition";

ALTER TABLE "vocab_entries" ADD COLUMN "root_verb" text;
ALTER TABLE "vocab_entries" ADD COLUMN "binyan" text;
ALTER TABLE "vocab_entries" ADD COLUMN "tense_aspect" text;
ALTER TABLE "vocab_entries" ADD COLUMN "state" text;
