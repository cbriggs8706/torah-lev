-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."group_type" AS ENUM('GROUP', 'SUBGROUP', 'TRIBE');--> statement-breakpoint
CREATE TYPE "public"."lesson" AS ENUM('1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20');--> statement-breakpoint
CREATE TYPE "public"."location_type" AS ENUM('in_person', 'zoom', 'hybrid');--> statement-breakpoint
CREATE TYPE "public"."type" AS ENUM('SELECT', 'ASSIST', 'HEAR', 'WATCH', 'PLAY', 'AUDIO-VISUAL', 'AUDIO-TEXT', 'VISUAL-AUDIO', 'VISUAL-TEXT', 'TEXT-AUDIO', 'TEXT-VISUAL');--> statement-breakpoint
CREATE TABLE "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unit_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"order" integer DEFAULT 0,
	"lesson_number" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
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
CREATE TABLE "units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"order" integer DEFAULT 0,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"image_src" text NOT NULL,
	"category" text,
	"start_proficiency_level" text,
	"end_proficiency_level" text,
	"public" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "courses_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
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
CREATE TABLE "verificationToken" (
	"identifier" varchar(255) NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "account" (
	"userId" uuid NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"providerAccountId" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(255),
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_group_schedule_lessons" ADD CONSTRAINT "study_group_schedule_lessons_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "public"."study_group_schedule"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_study_group_schedule_group" ON "study_group_schedule" USING btree ("study_group_id" int8_ops);--> statement-breakpoint
CREATE POLICY "Enable read access for all users" ON "game_results" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Enable read access for all users" ON "messages" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Enable read access for all users" ON "study_group_schedule" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Enable read access for all users" ON "study_group_schedule_lessons" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Enable read access for all users" ON "study_group_sessions" AS PERMISSIVE FOR SELECT TO public USING (true);
*/