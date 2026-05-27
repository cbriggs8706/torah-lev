CREATE TABLE IF NOT EXISTS "videos" (
	"id" serial PRIMARY KEY NOT NULL,
	"hebrew_lesson_script_id" integer,
	"hebrew_story_id" integer,
	"lesson_id" integer,
	"course_id" integer[],
	"part" integer,
	"title" text,
	"heb_title" text,
	"title_transliteration" text,
	"order" integer,
	"video_url" text,
	"image" text,
	"audio" text,
	"audio_src" text,
	"public" boolean,
	"category" text,
	"content" text,
	"content_plain" text,
	"type" "video_type"
);
--> statement-breakpoint
INSERT INTO "videos" (
	"hebrew_lesson_script_id",
	"lesson_id",
	"course_id",
	"part",
	"video_url",
	"audio_src",
	"content",
	"content_plain",
	"type"
)
SELECT
	"hls"."id",
	"hls"."lesson_id",
	"hls"."course_id",
	"hls"."part",
	"hls"."url",
	"hls"."audio_src",
	"hls"."content",
	"hls"."content_plain",
	'lesson'::"video_type"
FROM "hebrew_lesson_scripts" AS "hls"
WHERE NOT EXISTS (
	SELECT 1
	FROM "videos" AS "v"
	WHERE "v"."hebrew_lesson_script_id" = "hls"."id"
);
--> statement-breakpoint
INSERT INTO "videos" (
	"hebrew_story_id",
	"lesson_id",
	"course_id",
	"title",
	"heb_title",
	"title_transliteration",
	"order",
	"video_url",
	"image",
	"audio",
	"type",
	"public",
	"category",
	"content",
	"content_plain"
)
SELECT
	"hs"."id",
	"hs"."lesson_id",
	"hs"."course_id",
	"hs"."title",
	"hs"."heb_title",
	"hs"."title_transliteration",
	"hs"."order",
	"hs"."video",
	"hs"."image",
	"hs"."audio",
	'story'::"video_type",
	"hs"."public",
	"hs"."category",
	"hs"."content",
	"hs"."content_plain"
FROM "hebrew_stories" AS "hs"
WHERE NOT EXISTS (
	SELECT 1
	FROM "videos" AS "v"
	WHERE "v"."hebrew_story_id" = "hs"."id"
);
--> statement-breakpoint
UPDATE "videos"
SET "type" = 'lesson'::"video_type"
WHERE "hebrew_lesson_script_id" IS NOT NULL
	AND "type" IS DISTINCT FROM 'lesson'::"video_type";
--> statement-breakpoint
UPDATE "videos"
SET "type" = 'story'::"video_type"
WHERE "hebrew_story_id" IS NOT NULL
	AND "type" IS DISTINCT FROM 'story'::"video_type";
