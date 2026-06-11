CREATE INDEX IF NOT EXISTS "idx_challenges_lesson_order"
	ON "challenges" USING btree ("lesson_id", "order");

CREATE INDEX IF NOT EXISTS "idx_challenge_progress_user_challenge_completed"
	ON "challenge_progress" USING btree ("user_id", "challenge_id", "completed");
