ALTER TABLE "study_group_schedule_lessons"
	DROP COLUMN IF EXISTS "lesson_id",
	DROP COLUMN IF EXISTS "lesson_title";

ALTER TABLE "study_group_sessions"
	DROP COLUMN IF EXISTS "lesson_id",
	DROP COLUMN IF EXISTS "lesson_title";

DROP TABLE IF EXISTS "assignment_completions" CASCADE;
DROP TABLE IF EXISTS "attendance_records" CASCADE;
DROP TABLE IF EXISTS "thread_messages" CASCADE;
DROP TABLE IF EXISTS "thread_members" CASCADE;
DROP TABLE IF EXISTS "course_threads" CASCADE;
DROP TABLE IF EXISTS "occurrence_assignments" CASCADE;
DROP TABLE IF EXISTS "course_occurrences" CASCADE;
DROP TABLE IF EXISTS "course_memberships" CASCADE;
DROP TABLE IF EXISTS "course_meeting_times" CASCADE;
DROP TABLE IF EXISTS "course_enrollments" CASCADE;
DROP TABLE IF EXISTS "lesson_script_vocab" CASCADE;
DROP TABLE IF EXISTS "lesson_new_vocab" CASCADE;
DROP TABLE IF EXISTS "lesson_vocab_terms" CASCADE;
DROP TABLE IF EXISTS "lesson_translations" CASCADE;
DROP TABLE IF EXISTS "unit_translations" CASCADE;
DROP TABLE IF EXISTS "course_translations" CASCADE;
DROP TABLE IF EXISTS "lessons" CASCADE;
DROP TABLE IF EXISTS "units" CASCADE;
DROP TABLE IF EXISTS "courses" CASCADE;

DROP TYPE IF EXISTS "attendance_status";
DROP TYPE IF EXISTS "assignment_source_type";
DROP TYPE IF EXISTS "course_member_role";
DROP TYPE IF EXISTS "course_type";
DROP TYPE IF EXISTS "day_of_week";
DROP TYPE IF EXISTS "lesson";
DROP TYPE IF EXISTS "location_type";
DROP TYPE IF EXISTS "thread_member_role";
DROP TYPE IF EXISTS "thread_type";
