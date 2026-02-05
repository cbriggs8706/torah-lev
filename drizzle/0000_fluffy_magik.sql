DO $$ BEGIN
 CREATE TYPE "type" AS ENUM('SELECT', 'ASSIST', 'WATCH', 'AUDIO-VISUAL', 'AUDIO-TEXT', 'VISUAL-AUDIO', 'VISUAL-TEXT', 'TEXT-AUDIO', 'TEXT-VISUAL');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "flashcard_state" AS ENUM('new', 'learning', 'review', 'relearning', 'suspended');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "location_type" AS ENUM('in_person', 'zoom', 'hybrid');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "review_rating" AS ENUM('again', 'hard', 'good', 'easy');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "challenge_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"challenge_id" integer NOT NULL,
	"text" text NOT NULL,
	"correct" boolean NOT NULL,
	"image_src" text,
	"audio_src" text,
	"heb_niqqud" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "challenge_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"challenge_id" integer NOT NULL,
	"completed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "challenges" (
	"id" serial PRIMARY KEY NOT NULL,
	"lesson_id" integer NOT NULL,
	"type" "type" NOT NULL,
	"question" text NOT NULL,
	"order" integer NOT NULL,
	"video" text,
	"image" text,
	"audio" text,
	"hebNiqqud" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"category" text,
	"image_src" text NOT NULL,
	"proficiency_level" text,
	"ending_proficiency_level" text,
	"public" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "english_lesson_scripts" (
	"id" serial PRIMARY KEY NOT NULL,
	"lesson_id" text,
	"content" text,
	"audio_src" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "english_slides" (
	"id" serial PRIMARY KEY NOT NULL,
	"lesson_id" text DEFAULT '' NOT NULL,
	"google-url" text DEFAULT '' NOT NULL,
	"lesson_number" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "english_stories" (
	"id" serial PRIMARY KEY NOT NULL,
	"lesson_id" text,
	"title" text NOT NULL,
	"order" integer NOT NULL,
	"video" text,
	"image" text,
	"audio" text,
	"public" boolean DEFAULT true NOT NULL,
	"category" text DEFAULT '' NOT NULL,
	"content" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"heb_name" text,
	"category" text NOT NULL,
	"start_time" timestamp DEFAULT now() NOT NULL,
	"end_time" timestamp,
	"zoom_url" text,
	"recording_url" text,
	"address" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "flashcard_review_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"card_id" integer NOT NULL,
	"language" varchar(8) DEFAULT 'he' NOT NULL,
	"course_id" integer,
	"rating" "review_rating" NOT NULL,
	"reviewed_at" timestamp DEFAULT now() NOT NULL,
	"prev_interval_days" double precision,
	"next_interval_days" double precision,
	"prev_ease" double precision,
	"next_ease" double precision,
	"prev_state" "flashcard_state",
	"next_state" "flashcard_state"
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "flashcard_user_state" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"card_id" integer NOT NULL,
	"language" varchar(8) DEFAULT 'he' NOT NULL,
	"course_id" integer,
	"state" "flashcard_state" DEFAULT 'new' NOT NULL,
	"due_at" timestamp DEFAULT now() NOT NULL,
	"interval_days" double precision DEFAULT 0 NOT NULL,
	"ease" double precision DEFAULT 2.5 NOT NULL,
	"reps" integer DEFAULT 0 NOT NULL,
	"lapses" integer DEFAULT 0 NOT NULL,
	"last_reviewed_at" timestamp,
	"leech" boolean DEFAULT false NOT NULL,
	"leech_suspended_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "grammar_lessons" (
	"id" serial PRIMARY KEY NOT NULL,
	"lesson_id" text NOT NULL,
	"content" text,
	"content_plain" text,
	"audio_src" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "greek_lesson_scripts" (
	"id" serial PRIMARY KEY NOT NULL,
	"lesson_id" integer NOT NULL,
	"course_id" integer[],
	"part" integer,
	"content" text,
	"audio_src" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hebrew_lesson_scripts" (
	"id" serial PRIMARY KEY NOT NULL,
	"lesson_id" integer DEFAULT 1 NOT NULL,
	"course_id" integer[],
	"part" integer,
	"content" text,
	"content_plain" text,
	"audio_src" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hebrew_music_library" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"heb_title" text,
	"title_transliteration" text,
	"order" integer NOT NULL,
	"video" text,
	"image" text,
	"audio" text,
	"public" boolean DEFAULT false NOT NULL,
	"category" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hebrew_music_line" (
	"id" serial PRIMARY KEY NOT NULL,
	"hebrew_music_library_id" integer NOT NULL,
	"line_numbers" integer[] NOT NULL,
	"section_label" varchar NOT NULL,
	"eng_text" text NOT NULL,
	"heb_niqqud" text NOT NULL,
	"heb_text" text NOT NULL,
	"eng_transliteration" text NOT NULL,
	"audio_src" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hebrew_prayer_library" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"heb_title" text,
	"title_transliteration" text,
	"order" integer NOT NULL,
	"video" text,
	"image" text,
	"audio" text,
	"category" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hebrew_prayer_line" (
	"id" serial PRIMARY KEY NOT NULL,
	"hebrew_prayer_library_id" integer NOT NULL,
	"line_numbers" integer[] NOT NULL,
	"eng_text" text NOT NULL,
	"heb_niqqud" text NOT NULL,
	"heb_text" text NOT NULL,
	"eng_transliteration" text NOT NULL,
	"audio_src" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hebrew_stories" (
	"id" serial PRIMARY KEY NOT NULL,
	"lesson_id" integer DEFAULT 1 NOT NULL,
	"course_id" integer[],
	"title" text NOT NULL,
	"heb_title" text,
	"title_transliteration" text,
	"order" integer NOT NULL,
	"video" text,
	"image" text,
	"audio" text,
	"public" boolean DEFAULT true NOT NULL,
	"category" text DEFAULT '' NOT NULL,
	"content" text,
	"content_plain" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hebrew_word_forms" (
	"id" serial PRIMARY KEY NOT NULL,
	"word_id" integer,
	"form_type" text,
	"subtype" text,
	"person" integer,
	"gender" text,
	"number" text,
	"heb" text,
	"hebNiqqud" text NOT NULL,
	"eng" text,
	"ipa" text,
	"engTransliteration" text,
	"images" text[],
	"hebAudio" text,
	"lessons" text[]
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hebrew_words" (
	"id" serial PRIMARY KEY NOT NULL,
	"heb" text NOT NULL,
	"hebNiqqud" text NOT NULL,
	"eng" text NOT NULL,
	"person" integer,
	"gender" text,
	"number" text,
	"partOfSpeech" text[],
	"ipa" text,
	"engTransliteration" text,
	"dictionaryUrl" text,
	"images" text[],
	"hebAudio" text,
	"lessons" text[],
	"strongs" text,
	"type" text,
	"category" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "house_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"house_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"is_leader" boolean DEFAULT false NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "houses" (
	"id" serial PRIMARY KEY NOT NULL,
	"eng_name" text NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"img_src" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lessons" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"unit_id" integer NOT NULL,
	"order" integer NOT NULL,
	"lesson_number" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "message_threads" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_message_id" integer NOT NULL,
	"reply_message_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_id" text NOT NULL,
	"recipient_id" text,
	"tribe_id" integer,
	"study_group_id" integer,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"read_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "study_group_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"study_group_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "study_group_recurring_schedule" (
	"id" serial PRIMARY KEY NOT NULL,
	"study_group_id" integer NOT NULL,
	"days_of_week" text[] NOT NULL,
	"start_time" text NOT NULL,
	"timezone" text DEFAULT 'America/Chicago',
	"start_date" timestamp,
	"end_date" timestamp,
	"location_type" "location_type" DEFAULT 'zoom' NOT NULL,
	"location_name" text,
	"location_address" text,
	"zoom_link" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "study_group_schedule" (
	"id" serial PRIMARY KEY NOT NULL,
	"study_group_id" integer NOT NULL,
	"recurring_id" integer,
	"class_date" timestamp NOT NULL,
	"is_canceled" boolean DEFAULT false NOT NULL,
	"location_type" "location_type" DEFAULT 'zoom',
	"location_name" text,
	"location_address" text,
	"zoom_link" text,
	"notes" text,
	"homework_instructions" text,
	"homework_links" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "study_group_schedule_lessons" (
	"id" serial PRIMARY KEY NOT NULL,
	"schedule_id" integer NOT NULL,
	"lesson_id" integer NOT NULL,
	"order" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "study_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"current" boolean DEFAULT true NOT NULL,
	"time" text NOT NULL,
	"level" text NOT NULL,
	"organization" text NOT NULL,
	"section" text NOT NULL,
	"zoom_link" text,
	"teacher_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tribes" (
	"id" serial PRIMARY KEY NOT NULL,
	"eng_name" text NOT NULL,
	"heb_name" text NOT NULL,
	"heb_name_niqqud" text NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"img_src" text,
	"mother" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "units" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"course_id" integer NOT NULL,
	"order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_course_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"course_id" integer NOT NULL,
	"active_lesson_id" integer,
	"points" integer DEFAULT 0 NOT NULL,
	"hearts" integer DEFAULT 5 NOT NULL,
	"completed_lessons" integer DEFAULT 0 NOT NULL,
	"last_seen" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_progress" (
	"user_id" text PRIMARY KEY NOT NULL,
	"user_name" text DEFAULT 'User' NOT NULL,
	"hebrew_name" text,
	"spanish_name" text,
	"user_image_src" text DEFAULT '/mascot.svg' NOT NULL,
	"hebrew_image_src" text,
	"email" text DEFAULT '' NOT NULL,
	"active_course_id" integer,
	"hearts" integer DEFAULT 5 NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"tribe_id" integer,
	"is_hebrew_friend" boolean DEFAULT false NOT NULL,
	"is_spanish_friend" boolean DEFAULT false NOT NULL,
	"is_english_friend" boolean DEFAULT false NOT NULL,
	"is_bookclub_friend" boolean DEFAULT false NOT NULL,
	"is_tester" boolean DEFAULT false NOT NULL,
	"active_lesson_id" integer,
	"last_seen" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"is_teacher" boolean DEFAULT false NOT NULL,
	"assigned_by" text,
	"assigned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_subscription" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"stripe_customer_id" text NOT NULL,
	"stripe_subscription_id" text NOT NULL,
	"stripe_price_id" text NOT NULL,
	"stripe_current_period_end" timestamp NOT NULL,
	CONSTRAINT "user_subscription_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "user_subscription_stripe_customer_id_unique" UNIQUE("stripe_customer_id"),
	CONSTRAINT "user_subscription_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"username" varchar(100) NOT NULL,
	"email" varchar(255),
	"password_hash" text NOT NULL,
	"image" text,
	"role" varchar DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_flashcard_review_user_time" ON "flashcard_review_log" ("user_id","reviewed_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_flashcard_review_card_time" ON "flashcard_review_log" ("card_id","reviewed_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_flashcard_user_course_card_lang" ON "flashcard_user_state" ("user_id","course_id","card_id","language");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_flashcard_user_course_due" ON "flashcard_user_state" ("user_id","course_id","due_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_flashcard_user_course_state" ON "flashcard_user_state" ("user_id","course_id","state");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_course" ON "user_course_progress" ("user_id","course_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_user_course" ON "user_course_progress" ("user_id","course_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "challenge_options" ADD CONSTRAINT "challenge_options_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "challenges"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "challenge_progress" ADD CONSTRAINT "challenge_progress_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "challenges"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "challenges" ADD CONSTRAINT "challenges_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "flashcard_review_log" ADD CONSTRAINT "flashcard_review_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "flashcard_review_log" ADD CONSTRAINT "flashcard_review_log_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "flashcard_user_state" ADD CONSTRAINT "flashcard_user_state_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "flashcard_user_state" ADD CONSTRAINT "flashcard_user_state_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "hebrew_music_line" ADD CONSTRAINT "hebrew_music_line_hebrew_music_library_id_hebrew_music_library_id_fk" FOREIGN KEY ("hebrew_music_library_id") REFERENCES "hebrew_music_library"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "hebrew_prayer_line" ADD CONSTRAINT "hebrew_prayer_line_hebrew_prayer_library_id_hebrew_prayer_library_id_fk" FOREIGN KEY ("hebrew_prayer_library_id") REFERENCES "hebrew_prayer_library"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "hebrew_word_forms" ADD CONSTRAINT "hebrew_word_forms_word_id_hebrew_words_id_fk" FOREIGN KEY ("word_id") REFERENCES "hebrew_words"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "house_members" ADD CONSTRAINT "house_members_house_id_houses_id_fk" FOREIGN KEY ("house_id") REFERENCES "houses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "house_members" ADD CONSTRAINT "house_members_user_id_user_progress_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user_progress"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lessons" ADD CONSTRAINT "lessons_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_parent_message_id_messages_id_fk" FOREIGN KEY ("parent_message_id") REFERENCES "messages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_reply_message_id_messages_id_fk" FOREIGN KEY ("reply_message_id") REFERENCES "messages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_user_progress_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "user_progress"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_recipient_id_user_progress_user_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "user_progress"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_tribe_id_tribes_id_fk" FOREIGN KEY ("tribe_id") REFERENCES "tribes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_study_group_id_study_groups_id_fk" FOREIGN KEY ("study_group_id") REFERENCES "study_groups"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "study_group_members" ADD CONSTRAINT "study_group_members_study_group_id_study_groups_id_fk" FOREIGN KEY ("study_group_id") REFERENCES "study_groups"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "study_group_members" ADD CONSTRAINT "study_group_members_user_id_user_progress_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user_progress"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "study_group_recurring_schedule" ADD CONSTRAINT "study_group_recurring_schedule_study_group_id_study_groups_id_fk" FOREIGN KEY ("study_group_id") REFERENCES "study_groups"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "study_group_schedule" ADD CONSTRAINT "study_group_schedule_study_group_id_study_groups_id_fk" FOREIGN KEY ("study_group_id") REFERENCES "study_groups"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "study_group_schedule" ADD CONSTRAINT "study_group_schedule_recurring_id_study_group_recurring_schedule_id_fk" FOREIGN KEY ("recurring_id") REFERENCES "study_group_recurring_schedule"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "study_group_schedule_lessons" ADD CONSTRAINT "study_group_schedule_lessons_schedule_id_study_group_schedule_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "study_group_schedule"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "study_group_schedule_lessons" ADD CONSTRAINT "study_group_schedule_lessons_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "study_groups" ADD CONSTRAINT "study_groups_teacher_id_user_progress_user_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "user_progress"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "units" ADD CONSTRAINT "units_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_course_progress" ADD CONSTRAINT "user_course_progress_user_id_user_progress_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user_progress"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_course_progress" ADD CONSTRAINT "user_course_progress_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_course_progress" ADD CONSTRAINT "user_course_progress_active_lesson_id_lessons_id_fk" FOREIGN KEY ("active_lesson_id") REFERENCES "lessons"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_active_course_id_courses_id_fk" FOREIGN KEY ("active_course_id") REFERENCES "courses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_tribe_id_tribes_id_fk" FOREIGN KEY ("tribe_id") REFERENCES "tribes"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_active_lesson_id_lessons_id_fk" FOREIGN KEY ("active_lesson_id") REFERENCES "lessons"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_user_progress_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user_progress"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_assigned_by_user_progress_user_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "user_progress"("user_id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
