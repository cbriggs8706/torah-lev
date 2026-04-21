CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "target_languages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"number" integer NOT NULL,
	"part" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"course_id" uuid NOT NULL,
	"organization_id" uuid,
	"target_language_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"active_course_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_group_courses" (
	"study_group_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "study_group_courses_study_group_id_course_id_pk" PRIMARY KEY("study_group_id","course_id")
);
--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_target_language_id_target_languages_id_fk" FOREIGN KEY ("target_language_id") REFERENCES "public"."target_languages"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "study_groups" ADD CONSTRAINT "study_groups_active_course_id_courses_id_fk" FOREIGN KEY ("active_course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "study_group_courses" ADD CONSTRAINT "study_group_courses_study_group_id_study_groups_id_fk" FOREIGN KEY ("study_group_id") REFERENCES "public"."study_groups"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "study_group_courses" ADD CONSTRAINT "study_group_courses_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "organizations_title_idx" ON "organizations" USING btree ("title");
--> statement-breakpoint
CREATE INDEX "target_languages_name_idx" ON "target_languages" USING btree ("name");
--> statement-breakpoint
CREATE UNIQUE INDEX "target_languages_name_unique" ON "target_languages" USING btree ("name");
--> statement-breakpoint
CREATE INDEX "courses_title_idx" ON "courses" USING btree ("title");
--> statement-breakpoint
CREATE INDEX "lessons_course_idx" ON "lessons" USING btree ("course_id");
--> statement-breakpoint
CREATE INDEX "lessons_organization_idx" ON "lessons" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "lessons_target_language_idx" ON "lessons" USING btree ("target_language_id");
--> statement-breakpoint
CREATE INDEX "lessons_sort_idx" ON "lessons" USING btree ("sort_order","number");
--> statement-breakpoint
CREATE INDEX "study_groups_title_idx" ON "study_groups" USING btree ("title");
--> statement-breakpoint
CREATE INDEX "study_groups_active_course_idx" ON "study_groups" USING btree ("active_course_id");
--> statement-breakpoint
CREATE INDEX "study_group_courses_course_idx" ON "study_group_courses" USING btree ("course_id");
