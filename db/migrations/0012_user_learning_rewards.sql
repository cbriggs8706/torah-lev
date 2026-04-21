CREATE TABLE "user_learning_stats" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"hearts" integer DEFAULT 5 NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_learning_stats" ADD CONSTRAINT "user_learning_stats_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE TABLE "lesson_reward_claims" (
	"user_id" uuid NOT NULL,
	"study_group_id" uuid NOT NULL,
	"lesson_id" uuid NOT NULL,
	"hearts_awarded" integer NOT NULL,
	"points_awarded" integer NOT NULL,
	"claimed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_reward_claims_user_id_study_group_id_lesson_id_pk" PRIMARY KEY("user_id","study_group_id","lesson_id")
);
--> statement-breakpoint
ALTER TABLE "lesson_reward_claims" ADD CONSTRAINT "lesson_reward_claims_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "lesson_reward_claims" ADD CONSTRAINT "lesson_reward_claims_study_group_id_study_groups_id_fk" FOREIGN KEY ("study_group_id") REFERENCES "public"."study_groups"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "lesson_reward_claims" ADD CONSTRAINT "lesson_reward_claims_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "lesson_reward_claims_study_group_idx" ON "lesson_reward_claims" USING btree ("study_group_id");
--> statement-breakpoint
CREATE INDEX "lesson_reward_claims_lesson_idx" ON "lesson_reward_claims" USING btree ("lesson_id");
