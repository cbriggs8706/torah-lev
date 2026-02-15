CREATE TABLE "lesson_new_vocab" (
	"lesson_id" uuid NOT NULL,
	"vocab_term_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_new_vocab_lesson_id_vocab_term_id_pk" PRIMARY KEY("lesson_id","vocab_term_id")
);
--> statement-breakpoint
CREATE TABLE "lesson_script_vocab" (
	"lesson_id" uuid NOT NULL,
	"vocab_term_id" uuid NOT NULL,
	"surface_in_script" text NOT NULL,
	"frequency" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_script_vocab_lesson_id_vocab_term_id_pk" PRIMARY KEY("lesson_id","vocab_term_id")
);
--> statement-breakpoint
CREATE TABLE "lesson_vocab_terms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"surface" text NOT NULL,
	"consonants" text NOT NULL,
	"biblical_lexeme_id" uuid,
	"custom_lexeme_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_vocab_terms_consonants_unique" UNIQUE("consonants")
);
--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "primary_type" text DEFAULT 'youtube' NOT NULL;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "youtube_url" text;--> statement-breakpoint
ALTER TABLE "lesson_new_vocab" ADD CONSTRAINT "lesson_new_vocab_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_new_vocab" ADD CONSTRAINT "lesson_new_vocab_vocab_term_id_lesson_vocab_terms_id_fk" FOREIGN KEY ("vocab_term_id") REFERENCES "public"."lesson_vocab_terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_script_vocab" ADD CONSTRAINT "lesson_script_vocab_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_script_vocab" ADD CONSTRAINT "lesson_script_vocab_vocab_term_id_lesson_vocab_terms_id_fk" FOREIGN KEY ("vocab_term_id") REFERENCES "public"."lesson_vocab_terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_vocab_terms" ADD CONSTRAINT "lesson_vocab_terms_biblical_lexeme_id_hebrew_lexemes_id_fk" FOREIGN KEY ("biblical_lexeme_id") REFERENCES "public"."hebrew_lexemes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_vocab_terms" ADD CONSTRAINT "lesson_vocab_terms_custom_lexeme_id_custom_hebrew_lexemes_id_fk" FOREIGN KEY ("custom_lexeme_id") REFERENCES "public"."custom_hebrew_lexemes"("id") ON DELETE set null ON UPDATE no action;