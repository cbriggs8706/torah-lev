CREATE TABLE "study_group_memberships" (
	"study_group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text DEFAULT 'student' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "study_group_memberships_study_group_id_user_id_pk" PRIMARY KEY("study_group_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "study_group_memberships" ADD CONSTRAINT "study_group_memberships_study_group_id_study_groups_id_fk" FOREIGN KEY ("study_group_id") REFERENCES "public"."study_groups"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "study_group_memberships" ADD CONSTRAINT "study_group_memberships_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "study_group_memberships_user_idx" ON "study_group_memberships" USING btree ("user_id");
