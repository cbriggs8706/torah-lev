CREATE TABLE IF NOT EXISTS "flashcard_user_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"language" varchar(8) DEFAULT 'he' NOT NULL,
	"course_id" integer,
	"session_size" integer DEFAULT 20 NOT NULL,
	"new_ratio" double precision DEFAULT 0.2 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vocab_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_key" text NOT NULL,
	"language" varchar(8) NOT NULL,
	"course_id" integer,
	"entry_id" integer NOT NULL,
	"lessons" text[] DEFAULT  NOT NULL,
	"type" text,
	"category" text,
	"eng" text,
	"eng_definition" text,
	"part_of_speech" text[],
	"ipa" text,
	"images" text[] DEFAULT  NOT NULL,
	"heb_niqqud" text,
	"heb" text,
	"heb_audio" text,
	"grk" text,
	"grk_audio" text,
	"spa" text,
	"por" text,
	"eng_audio" text,
	"eng_transliteration" text,
	"spa_transliteration" text,
	"por_transliteration" text,
	"gender_person" text,
	"person" text,
	"gender" text,
	"number" text,
	"dictionary_url" text,
	"synonyms" text[],
	"antonyms" text[],
	"scriptures" text[],
	"strongs" text,
	"introduction" text,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "flashcard_user_state" ADD COLUMN "learning_step" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_flashcard_settings_user_course_lang" ON "flashcard_user_settings" ("user_id","course_id","language");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_flashcard_settings_user_course" ON "flashcard_user_settings" ("user_id","course_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_vocab_source_entry" ON "vocab_entries" ("source_key","entry_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_vocab_source_key" ON "vocab_entries" ("source_key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_vocab_course_id" ON "vocab_entries" ("course_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_vocab_language" ON "vocab_entries" ("language");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "flashcard_user_settings" ADD CONSTRAINT "flashcard_user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "flashcard_user_settings" ADD CONSTRAINT "flashcard_user_settings_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
