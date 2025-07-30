ALTER TABLE "user_progress"
ADD COLUMN IF NOT EXISTS "active_lesson_id" integer REFERENCES "lessons"("id") ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS "last_seen" timestamp DEFAULT now() NOT NULL;
