ALTER TABLE "flashcard_user_state"
ADD COLUMN IF NOT EXISTS "is_mastered" boolean DEFAULT false NOT NULL;

ALTER TABLE "flashcard_user_state"
ADD COLUMN IF NOT EXISTS "in_my_stack" boolean DEFAULT false NOT NULL;
