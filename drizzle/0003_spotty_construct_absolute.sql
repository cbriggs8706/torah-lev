CREATE TABLE "construct_absolute_words" (
	"id" serial PRIMARY KEY NOT NULL,
	"lesson_id" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"absolute" text NOT NULL,
	"construct" text NOT NULL,
	"absolute_transliteration" text,
	"construct_transliteration" text,
	"gloss" text NOT NULL,
	"notes" text,
	"show_in_word_sort" boolean DEFAULT true NOT NULL,
	"show_in_converter" boolean DEFAULT true NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "construct_absolute_words" ADD CONSTRAINT "construct_absolute_words_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_construct_absolute_lesson_id" ON "construct_absolute_words" USING btree ("lesson_id");
--> statement-breakpoint
CREATE INDEX "idx_construct_absolute_sort" ON "construct_absolute_words" USING btree ("lesson_id","sort_order");
