CREATE TYPE "public"."media_kind" AS ENUM('image', 'audio', 'video', 'document', 'other');--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "media_kind" NOT NULL,
	"bucket" text NOT NULL,
	"object_path" text NOT NULL,
	"file_name" text NOT NULL,
	"original_file_name" text,
	"title" text,
	"alt_text" text,
	"description" text,
	"mime_type" text,
	"file_extension" varchar(20),
	"size_bytes" bigint,
	"width" integer,
	"height" integer,
	"duration_seconds" integer,
	"blurhash" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"uploaded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "media_asset_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"usage" text DEFAULT 'default' NOT NULL,
	"locale" varchar(10),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_asset_links" ADD CONSTRAINT "media_asset_links_asset_id_media_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_asset_links" ADD CONSTRAINT "media_asset_links_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "media_assets_object_path_unique" ON "media_assets" USING btree ("bucket","object_path");--> statement-breakpoint
CREATE INDEX "media_assets_kind_idx" ON "media_assets" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "media_assets_uploaded_by_idx" ON "media_assets" USING btree ("uploaded_by");--> statement-breakpoint
CREATE INDEX "media_assets_created_at_idx" ON "media_assets" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "media_asset_links_entity_lookup_idx" ON "media_asset_links" USING btree ("entity_type","entity_id","usage","sort_order");--> statement-breakpoint
CREATE INDEX "media_asset_links_asset_idx" ON "media_asset_links" USING btree ("asset_id");--> statement-breakpoint
CREATE UNIQUE INDEX "media_asset_links_unique_usage" ON "media_asset_links" USING btree ("asset_id","entity_type","entity_id","usage","locale");--> statement-breakpoint
