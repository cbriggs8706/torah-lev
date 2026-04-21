DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'module_type') THEN
		CREATE TYPE module_type AS ENUM ('video', 'audio', 'document', 'quiz');
	END IF;
	IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quiz_type') THEN
		CREATE TYPE quiz_type AS ENUM (
			'image_to_audio',
			'audio_to_image',
			'text_to_audio',
			'audio_to_text',
			'text_to_image',
			'image_to_text'
		);
	END IF;
END $$;

CREATE TABLE "quizzes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"type" quiz_type NOT NULL,
	"prompt_text" text,
	"prompt_asset_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_question_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"answer_text" text,
	"answer_asset_id" uuid,
	"is_correct" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_question_assignments" (
	"quiz_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quiz_question_assignments_quiz_id_question_id_pk" PRIMARY KEY("quiz_id","question_id")
);
--> statement-breakpoint
CREATE TABLE "modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"type" module_type NOT NULL,
	"media_asset_id" uuid,
	"external_url" text,
	"quiz_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_modules" (
	"lesson_id" uuid NOT NULL,
	"module_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_modules_lesson_id_module_id_pk" PRIMARY KEY("lesson_id","module_id")
);
--> statement-breakpoint
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_prompt_asset_id_media_assets_id_fk" FOREIGN KEY ("prompt_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "quiz_question_answers" ADD CONSTRAINT "quiz_question_answers_question_id_quiz_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_questions"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "quiz_question_answers" ADD CONSTRAINT "quiz_question_answers_answer_asset_id_media_assets_id_fk" FOREIGN KEY ("answer_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "quiz_question_assignments" ADD CONSTRAINT "quiz_question_assignments_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "quiz_question_assignments" ADD CONSTRAINT "quiz_question_assignments_question_id_quiz_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_questions"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "modules" ADD CONSTRAINT "modules_media_asset_id_media_assets_id_fk" FOREIGN KEY ("media_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "modules" ADD CONSTRAINT "modules_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "lesson_modules" ADD CONSTRAINT "lesson_modules_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "lesson_modules" ADD CONSTRAINT "lesson_modules_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "quizzes_title_idx" ON "quizzes" USING btree ("title");
--> statement-breakpoint
CREATE INDEX "quiz_questions_title_idx" ON "quiz_questions" USING btree ("title");
--> statement-breakpoint
CREATE INDEX "quiz_questions_type_idx" ON "quiz_questions" USING btree ("type");
--> statement-breakpoint
CREATE INDEX "quiz_questions_prompt_asset_idx" ON "quiz_questions" USING btree ("prompt_asset_id");
--> statement-breakpoint
CREATE INDEX "quiz_question_answers_question_idx" ON "quiz_question_answers" USING btree ("question_id");
--> statement-breakpoint
CREATE INDEX "quiz_question_answers_asset_idx" ON "quiz_question_answers" USING btree ("answer_asset_id");
--> statement-breakpoint
CREATE INDEX "quiz_question_assignments_question_idx" ON "quiz_question_assignments" USING btree ("question_id");
--> statement-breakpoint
CREATE INDEX "modules_title_idx" ON "modules" USING btree ("title");
--> statement-breakpoint
CREATE INDEX "modules_type_idx" ON "modules" USING btree ("type");
--> statement-breakpoint
CREATE INDEX "modules_media_asset_idx" ON "modules" USING btree ("media_asset_id");
--> statement-breakpoint
CREATE INDEX "modules_quiz_idx" ON "modules" USING btree ("quiz_id");
--> statement-breakpoint
CREATE INDEX "lesson_modules_module_idx" ON "lesson_modules" USING btree ("module_id");
