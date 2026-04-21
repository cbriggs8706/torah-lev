CREATE TABLE "lesson_module_completions" (
	"user_id" uuid NOT NULL,
	"study_group_id" uuid NOT NULL,
	"lesson_id" uuid NOT NULL,
	"module_id" uuid NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_module_completions_user_id_study_group_id_lesson_id_module_id_pk" PRIMARY KEY("user_id","study_group_id","lesson_id","module_id")
);
--> statement-breakpoint
ALTER TABLE "lesson_module_completions" ADD CONSTRAINT "lesson_module_completions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "lesson_module_completions" ADD CONSTRAINT "lesson_module_completions_study_group_id_study_groups_id_fk" FOREIGN KEY ("study_group_id") REFERENCES "public"."study_groups"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "lesson_module_completions" ADD CONSTRAINT "lesson_module_completions_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "lesson_module_completions" ADD CONSTRAINT "lesson_module_completions_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "lesson_module_completions_study_group_idx" ON "lesson_module_completions" USING btree ("study_group_id");
--> statement-breakpoint
CREATE INDEX "lesson_module_completions_lesson_idx" ON "lesson_module_completions" USING btree ("lesson_id");
--> statement-breakpoint
CREATE INDEX "lesson_module_completions_module_idx" ON "lesson_module_completions" USING btree ("module_id");
