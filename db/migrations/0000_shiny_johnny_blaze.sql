CREATE TYPE "public"."assignment_source_type" AS ENUM('existing_lesson', 'existing_chapter', 'custom');--> statement-breakpoint
CREATE TYPE "public"."attendance_status" AS ENUM('present', 'absent', 'late');--> statement-breakpoint
CREATE TYPE "public"."book_type" AS ENUM('SCRIPTURE', 'STORY', 'LESSON-SCRIPT', 'SONG', 'PRAYER');--> statement-breakpoint
CREATE TYPE "public"."course_member_role" AS ENUM('organizer', 'teacher', 'ta', 'student');--> statement-breakpoint
CREATE TYPE "public"."course_type" AS ENUM('INPERSON', 'VIRTUAL', 'HYBRID', 'SELFPACED');--> statement-breakpoint
CREATE TYPE "public"."day_of_week" AS ENUM('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN');--> statement-breakpoint
CREATE TYPE "public"."group_type" AS ENUM('GROUP', 'SUBGROUP', 'TRIBE');--> statement-breakpoint
CREATE TYPE "public"."language" AS ENUM('BIBLICAL-HEBREW', 'BIBLICAL-GREEK', 'MODERN-HEBREW', 'MODERN-ENGLISH', 'MODERN-SPANISH');--> statement-breakpoint
CREATE TYPE "public"."lesson" AS ENUM('1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20');--> statement-breakpoint
CREATE TYPE "public"."location_type" AS ENUM('in_person', 'zoom', 'hybrid');--> statement-breakpoint
CREATE TYPE "public"."proficiency_level" AS ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2');--> statement-breakpoint
CREATE TYPE "public"."thread_member_role" AS ENUM('owner', 'member');--> statement-breakpoint
CREATE TYPE "public"."thread_type" AS ENUM('course', 'dm', 'group');--> statement-breakpoint
CREATE TYPE "public"."type" AS ENUM('SELECT', 'ASSIST', 'HEAR', 'WATCH', 'PLAY', 'AUDIO-VISUAL', 'AUDIO-TEXT', 'VISUAL-AUDIO', 'VISUAL-TEXT', 'TEXT-AUDIO', 'TEXT-VISUAL');--> statement-breakpoint
CREATE TABLE "game_results" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "game_results_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"study_group_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"user_name" text NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "game_results" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_id" text NOT NULL,
	"study_group_id" integer NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"temp_id" text
);
--> statement-breakpoint
ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "study_group_schedule" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "study_group_schedule_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"study_group_id" bigint NOT NULL,
	"class_date" timestamp with time zone NOT NULL,
	"notes" text,
	"homework_instructions" text,
	"homework_links" text[],
	"is_canceled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"homework_links_json" jsonb,
	"recording_link" text
);
--> statement-breakpoint
ALTER TABLE "study_group_schedule" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "study_group_schedule_lessons" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "study_group_schedule_lessons_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"schedule_id" bigint NOT NULL,
	"lesson_id" integer NOT NULL,
	"order_index" integer DEFAULT 1,
	"lesson_title" text
);
--> statement-breakpoint
ALTER TABLE "study_group_schedule_lessons" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "study_group_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"study_group_id" integer NOT NULL,
	"lesson_id" integer,
	"lesson_title" text,
	"is_active" boolean DEFAULT false,
	"started_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "study_group_sessions_study_group_id_key" UNIQUE("study_group_id")
);
--> statement-breakpoint
ALTER TABLE "study_group_sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "assignment_completions" (
	"assignment_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assignment_completions_assignment_id_user_id_pk" PRIMARY KEY("assignment_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "attendance_records" (
	"occurrence_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "attendance_status" NOT NULL,
	"notes" text,
	"marked_by" uuid,
	"marked_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attendance_records_occurrence_id_user_id_pk" PRIMARY KEY("occurrence_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "course_memberships" (
	"course_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "course_member_role" DEFAULT 'student' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"invited_by" uuid,
	CONSTRAINT "course_memberships_course_id_user_id_pk" PRIMARY KEY("course_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "course_occurrences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"timezone" text DEFAULT 'America/Denver' NOT NULL,
	"title" text,
	"notes" text,
	"is_canceled" boolean DEFAULT false NOT NULL,
	"attendance_enabled" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"type" "thread_type" DEFAULT 'course' NOT NULL,
	"name" text,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "occurrence_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"occurrence_id" uuid NOT NULL,
	"source_type" "assignment_source_type" DEFAULT 'custom' NOT NULL,
	"unit_id" uuid,
	"lesson_id" uuid,
	"chapter_ref" text,
	"title" text NOT NULL,
	"content_html" text,
	"content_text" text,
	"attachments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "thread_members" (
	"thread_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "thread_member_role" DEFAULT 'member' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_read_at" timestamp with time zone,
	CONSTRAINT "thread_members_thread_id_user_id_pk" PRIMARY KEY("thread_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "thread_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"content_html" text NOT NULL,
	"content_text" text,
	"attachments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "course_enrollments" (
	"course_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"role" text DEFAULT 'student' NOT NULL,
	"enrolled_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "course_enrollments_course_id_student_id_pk" PRIMARY KEY("course_id","student_id")
);
--> statement-breakpoint
CREATE TABLE "course_meeting_times" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"day" "day_of_week" NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time,
	"timezone" text DEFAULT 'America/Denver'
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"course_code" text NOT NULL,
	"section" varchar(10),
	"type" "course_type" NOT NULL,
	"language" "language" NOT NULL,
	"description" text,
	"image_src" text,
	"category" text,
	"current" boolean DEFAULT true NOT NULL,
	"start_proficiency_level" "proficiency_level" NOT NULL,
	"end_proficiency_level" "proficiency_level" NOT NULL,
	"public" boolean DEFAULT true NOT NULL,
	"startdate" timestamp,
	"enddate" timestamp,
	"organizer_id" uuid,
	"organizer_group_name" text,
	"location" text,
	"zoom_link" text,
	"max_enrollment" integer,
	"enrollment_open" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "courses_slug_unique" UNIQUE("slug"),
	CONSTRAINT "courses_course_code_unique" UNIQUE("course_code")
);
--> statement-breakpoint
CREATE TABLE "units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"order" integer DEFAULT 0,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unit_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"order" integer DEFAULT 0,
	"lesson_number" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"video" text,
	"secondary_video" text,
	"lesson_script" text,
	"grammar_lesson" text,
	"image" text
);
--> statement-breakpoint
CREATE TABLE "account" (
	"userId" uuid NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"providerAccountId" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer DEFAULT 0 NOT NULL,
	"token_type" varchar(255),
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255),
	"email" varchar(255) NOT NULL,
	"emailVerified" timestamp with time zone,
	"image" text,
	"username" varchar(100),
	"password_hash" text,
	"role" varchar(50) DEFAULT 'user' NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verificationToken" (
	"identifier" varchar(255) NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "hebrew_books" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" "book_type" DEFAULT 'SCRIPTURE' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hebrew_chapters" (
	"id" text PRIMARY KEY NOT NULL,
	"book_id" integer NOT NULL,
	"chapter_number" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hebrew_verses" (
	"id" text PRIMARY KEY NOT NULL,
	"book_id" integer NOT NULL,
	"chapter_id" text NOT NULL,
	"chapter_number" integer NOT NULL,
	"verse_number" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hebrew_words" (
	"id" text PRIMARY KEY NOT NULL,
	"book_id" integer NOT NULL,
	"chapter_id" text NOT NULL,
	"verse_id" text NOT NULL,
	"word_seq" integer NOT NULL,
	"surface" text NOT NULL,
	"lemma_vocalized" text,
	"lemma" text NOT NULL,
	"part_of_speech" text,
	"verb_stem" text,
	"verb_tense" text,
	"root" text,
	"person" integer,
	"gender" text,
	"number" text,
	"tags" text[],
	"lexeme_id" uuid,
	"lemma_norm" text,
	"lemma_clean" text
);
--> statement-breakpoint
CREATE TABLE "custom_hebrew_books" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"source" text DEFAULT 'CUSTOM',
	"linked_hebrew_book_id" integer,
	CONSTRAINT "custom_hebrew_books_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "custom_hebrew_chapters" (
	"id" text PRIMARY KEY NOT NULL,
	"book_id" integer NOT NULL,
	"chapter_number" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_hebrew_verses" (
	"id" text PRIMARY KEY NOT NULL,
	"book_id" integer NOT NULL,
	"chapter_id" text NOT NULL,
	"chapter_number" integer NOT NULL,
	"verse_number" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_hebrew_words" (
	"id" text PRIMARY KEY NOT NULL,
	"book_id" integer NOT NULL,
	"chapter_id" text NOT NULL,
	"verse_id" text NOT NULL,
	"word_seq" integer NOT NULL,
	"surface" text NOT NULL,
	"consonants" text NOT NULL,
	"lexeme_id" uuid,
	"custom_lexeme_id" uuid,
	CONSTRAINT "custom_hebrew_words_exactly_one_lexeme_ref" CHECK (((CASE WHEN "custom_hebrew_words"."lexeme_id" IS NULL THEN 0 ELSE 1 END) + (CASE WHEN "custom_hebrew_words"."custom_lexeme_id" IS NULL THEN 0 ELSE 1 END)) = 1)
);
--> statement-breakpoint
CREATE TABLE "custom_hebrew_lexemes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lemma" text NOT NULL,
	"lemma_clean" text NOT NULL,
	"source" varchar(20) DEFAULT 'CUSTOM' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "custom_hebrew_lexemes_lemma_clean_unique" UNIQUE("lemma_clean")
);
--> statement-breakpoint
CREATE TABLE "custom_hebrew_ingest_audits" (
	"id" serial PRIMARY KEY NOT NULL,
	"custom_hebrew_book_id" integer NOT NULL,
	"chapter_number" integer NOT NULL,
	"actor_user_id" text,
	"status" text NOT NULL,
	"exact_bible_match" boolean DEFAULT false NOT NULL,
	"verse_count" integer NOT NULL,
	"token_count" integer NOT NULL,
	"known_token_count" integer NOT NULL,
	"new_token_count" integer NOT NULL,
	"override_count" integer NOT NULL,
	"summary" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hebrew_lexemes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lemma" text NOT NULL,
	"lemma_vocalized" text,
	"root" text,
	"part_of_speech" varchar(20),
	"binyan" varchar(20),
	"strongs" varchar(10),
	"definition" text,
	"synonyms" uuid[],
	"antonyms" uuid[],
	"frequency" integer,
	"gloss_english" text,
	"gloss_tbesh" text,
	"meaning_tbesh" text,
	"gloss_espanol" text,
	"gloss_portugues" text,
	"gloss_netherlands" text,
	"gloss_greek" text,
	"source" varchar(20) DEFAULT 'BIBLICAL',
	"notes" text,
	"teaching_notes" text,
	"images" text[] DEFAULT '{}',
	"audio" text[] DEFAULT '{}',
	"video" text[] DEFAULT '{}',
	"ipa" text,
	"lemma_norm" text,
	"lemma_clean" text,
	CONSTRAINT "hebrew_lexemes_lemma_unique" UNIQUE("lemma")
);
--> statement-breakpoint
CREATE TABLE "etcbc_words_raw" (
	"word_node" integer PRIMARY KEY NOT NULL,
	"book" text NOT NULL,
	"chapter" integer NOT NULL,
	"verse" integer NOT NULL,
	"g_word_utf8" text,
	"g_cons_utf8" text,
	"g_word" text,
	"g_cons" text,
	"trailer_utf8" text,
	"trailer" text,
	"sp" varchar(10),
	"vs" varchar(10),
	"vt" varchar(10),
	"gn" varchar(10),
	"nu" varchar(10),
	"ps" varchar(10),
	"st" varchar(5),
	"prs" text,
	"prs_gn" varchar(10),
	"prs_nu" varchar(10),
	"prs_ps" varchar(10),
	"pfm" text,
	"vbe" text,
	"uvf" text,
	"ls" text,
	"pdp" text,
	"function" text,
	"rela" text,
	"typ" text,
	"domain" text,
	"lexeme_node" integer
);
--> statement-breakpoint
ALTER TABLE "study_group_schedule_lessons" ADD CONSTRAINT "study_group_schedule_lessons_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "public"."study_group_schedule"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_completions" ADD CONSTRAINT "assignment_completions_assignment_id_occurrence_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."occurrence_assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_completions" ADD CONSTRAINT "assignment_completions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_occurrence_id_course_occurrences_id_fk" FOREIGN KEY ("occurrence_id") REFERENCES "public"."course_occurrences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_marked_by_user_id_fk" FOREIGN KEY ("marked_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_memberships" ADD CONSTRAINT "course_memberships_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_memberships" ADD CONSTRAINT "course_memberships_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_memberships" ADD CONSTRAINT "course_memberships_invited_by_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_occurrences" ADD CONSTRAINT "course_occurrences_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_occurrences" ADD CONSTRAINT "course_occurrences_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_threads" ADD CONSTRAINT "course_threads_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_threads" ADD CONSTRAINT "course_threads_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "occurrence_assignments" ADD CONSTRAINT "occurrence_assignments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "occurrence_assignments" ADD CONSTRAINT "occurrence_assignments_occurrence_id_course_occurrences_id_fk" FOREIGN KEY ("occurrence_id") REFERENCES "public"."course_occurrences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "occurrence_assignments" ADD CONSTRAINT "occurrence_assignments_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "occurrence_assignments" ADD CONSTRAINT "occurrence_assignments_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "occurrence_assignments" ADD CONSTRAINT "occurrence_assignments_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thread_members" ADD CONSTRAINT "thread_members_thread_id_course_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."course_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thread_members" ADD CONSTRAINT "thread_members_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thread_messages" ADD CONSTRAINT "thread_messages_thread_id_course_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."course_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thread_messages" ADD CONSTRAINT "thread_messages_sender_id_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_student_id_user_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_meeting_times" ADD CONSTRAINT "course_meeting_times_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_organizer_id_user_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hebrew_chapters" ADD CONSTRAINT "hebrew_chapters_book_id_hebrew_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."hebrew_books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hebrew_verses" ADD CONSTRAINT "hebrew_verses_book_id_hebrew_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."hebrew_books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hebrew_verses" ADD CONSTRAINT "hebrew_verses_chapter_id_hebrew_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."hebrew_chapters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hebrew_words" ADD CONSTRAINT "hebrew_words_book_id_hebrew_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."hebrew_books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hebrew_words" ADD CONSTRAINT "hebrew_words_chapter_id_hebrew_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."hebrew_chapters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hebrew_words" ADD CONSTRAINT "hebrew_words_verse_id_hebrew_verses_id_fk" FOREIGN KEY ("verse_id") REFERENCES "public"."hebrew_verses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hebrew_words" ADD CONSTRAINT "hebrew_words_lexeme_id_hebrew_lexemes_id_fk" FOREIGN KEY ("lexeme_id") REFERENCES "public"."hebrew_lexemes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_hebrew_books" ADD CONSTRAINT "custom_hebrew_books_linked_hebrew_book_id_hebrew_books_id_fk" FOREIGN KEY ("linked_hebrew_book_id") REFERENCES "public"."hebrew_books"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_hebrew_chapters" ADD CONSTRAINT "custom_hebrew_chapters_book_id_custom_hebrew_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."custom_hebrew_books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_hebrew_verses" ADD CONSTRAINT "custom_hebrew_verses_book_id_custom_hebrew_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."custom_hebrew_books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_hebrew_verses" ADD CONSTRAINT "custom_hebrew_verses_chapter_id_custom_hebrew_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."custom_hebrew_chapters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_hebrew_words" ADD CONSTRAINT "custom_hebrew_words_book_id_custom_hebrew_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."custom_hebrew_books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_hebrew_words" ADD CONSTRAINT "custom_hebrew_words_chapter_id_custom_hebrew_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."custom_hebrew_chapters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_hebrew_words" ADD CONSTRAINT "custom_hebrew_words_verse_id_custom_hebrew_verses_id_fk" FOREIGN KEY ("verse_id") REFERENCES "public"."custom_hebrew_verses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_hebrew_words" ADD CONSTRAINT "custom_hebrew_words_lexeme_id_hebrew_lexemes_id_fk" FOREIGN KEY ("lexeme_id") REFERENCES "public"."hebrew_lexemes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_hebrew_words" ADD CONSTRAINT "custom_hebrew_words_custom_lexeme_id_custom_hebrew_lexemes_id_fk" FOREIGN KEY ("custom_lexeme_id") REFERENCES "public"."custom_hebrew_lexemes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_hebrew_ingest_audits" ADD CONSTRAINT "custom_hebrew_ingest_audits_custom_hebrew_book_id_custom_hebrew_books_id_fk" FOREIGN KEY ("custom_hebrew_book_id") REFERENCES "public"."custom_hebrew_books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_study_group_schedule_group" ON "study_group_schedule" USING btree ("study_group_id" int8_ops);--> statement-breakpoint
CREATE INDEX "assignment_completions_user_idx" ON "assignment_completions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "attendance_records_user_idx" ON "attendance_records" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "course_memberships_course_role_idx" ON "course_memberships" USING btree ("course_id","role");--> statement-breakpoint
CREATE INDEX "course_memberships_user_idx" ON "course_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "course_occurrences_course_start_idx" ON "course_occurrences" USING btree ("course_id","starts_at");--> statement-breakpoint
CREATE INDEX "course_threads_course_type_idx" ON "course_threads" USING btree ("course_id","type");--> statement-breakpoint
CREATE INDEX "occurrence_assignments_occurrence_order_idx" ON "occurrence_assignments" USING btree ("occurrence_id","order_index");--> statement-breakpoint
CREATE INDEX "occurrence_assignments_course_idx" ON "occurrence_assignments" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "thread_members_user_idx" ON "thread_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "thread_messages_thread_created_idx" ON "thread_messages" USING btree ("thread_id","created_at");--> statement-breakpoint
CREATE INDEX "thread_messages_sender_idx" ON "thread_messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "course_meeting_times_course_id_idx" ON "course_meeting_times" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "course_meeting_times_day_idx" ON "course_meeting_times" USING btree ("day");--> statement-breakpoint
CREATE INDEX "courses_organizer_id_idx" ON "courses" USING btree ("organizer_id");--> statement-breakpoint
CREATE POLICY "Enable read access for all users" ON "game_results" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Enable read access for all users" ON "messages" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Enable read access for all users" ON "study_group_schedule" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Enable read access for all users" ON "study_group_schedule_lessons" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Enable read access for all users" ON "study_group_sessions" AS PERMISSIVE FOR SELECT TO public USING (true);