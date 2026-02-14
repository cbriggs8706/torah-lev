DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'course_member_role') THEN
		CREATE TYPE course_member_role AS ENUM ('organizer', 'teacher', 'ta', 'student');
	END IF;
	IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assignment_source_type') THEN
		CREATE TYPE assignment_source_type AS ENUM ('existing_lesson', 'existing_chapter', 'custom');
	END IF;
	IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendance_status') THEN
		CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late');
	END IF;
	IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'thread_type') THEN
		CREATE TYPE thread_type AS ENUM ('course', 'dm', 'group');
	END IF;
	IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'thread_member_role') THEN
		CREATE TYPE thread_member_role AS ENUM ('owner', 'member');
	END IF;
END $$;

CREATE TABLE IF NOT EXISTS course_memberships (
	course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
	user_id uuid NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
	role course_member_role NOT NULL DEFAULT 'student',
	joined_at timestamptz NOT NULL DEFAULT now(),
	invited_by uuid REFERENCES "user"(id) ON DELETE SET NULL,
	PRIMARY KEY (course_id, user_id)
);
CREATE INDEX IF NOT EXISTS course_memberships_course_role_idx ON course_memberships(course_id, role);
CREATE INDEX IF NOT EXISTS course_memberships_user_idx ON course_memberships(user_id);

CREATE TABLE IF NOT EXISTS course_occurrences (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
	starts_at timestamptz NOT NULL,
	ends_at timestamptz,
	timezone text NOT NULL DEFAULT 'America/Denver',
	title text,
	notes text,
	is_canceled boolean NOT NULL DEFAULT false,
	attendance_enabled boolean NOT NULL DEFAULT false,
	created_by uuid REFERENCES "user"(id) ON DELETE SET NULL,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS course_occurrences_course_start_idx ON course_occurrences(course_id, starts_at);

CREATE TABLE IF NOT EXISTS occurrence_assignments (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
	occurrence_id uuid NOT NULL REFERENCES course_occurrences(id) ON DELETE CASCADE,
	source_type assignment_source_type NOT NULL DEFAULT 'custom',
	unit_id uuid REFERENCES units(id) ON DELETE SET NULL,
	lesson_id uuid REFERENCES lessons(id) ON DELETE SET NULL,
	chapter_ref text,
	title text NOT NULL,
	content_html text,
	content_text text,
	attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
	order_index integer NOT NULL DEFAULT 0,
	created_by uuid REFERENCES "user"(id) ON DELETE SET NULL,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS occurrence_assignments_occurrence_order_idx ON occurrence_assignments(occurrence_id, order_index);
CREATE INDEX IF NOT EXISTS occurrence_assignments_course_idx ON occurrence_assignments(course_id);

CREATE TABLE IF NOT EXISTS assignment_completions (
	assignment_id uuid NOT NULL REFERENCES occurrence_assignments(id) ON DELETE CASCADE,
	user_id uuid NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
	completed_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	PRIMARY KEY (assignment_id, user_id)
);
CREATE INDEX IF NOT EXISTS assignment_completions_user_idx ON assignment_completions(user_id);

CREATE TABLE IF NOT EXISTS attendance_records (
	occurrence_id uuid NOT NULL REFERENCES course_occurrences(id) ON DELETE CASCADE,
	user_id uuid NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
	status attendance_status NOT NULL,
	notes text,
	marked_by uuid REFERENCES "user"(id) ON DELETE SET NULL,
	marked_at timestamptz NOT NULL DEFAULT now(),
	PRIMARY KEY (occurrence_id, user_id)
);
CREATE INDEX IF NOT EXISTS attendance_records_user_idx ON attendance_records(user_id);

CREATE TABLE IF NOT EXISTS course_threads (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
	type thread_type NOT NULL DEFAULT 'course',
	name text,
	is_archived boolean NOT NULL DEFAULT false,
	created_by uuid REFERENCES "user"(id) ON DELETE SET NULL,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS course_threads_course_type_idx ON course_threads(course_id, type);

CREATE TABLE IF NOT EXISTS thread_members (
	thread_id uuid NOT NULL REFERENCES course_threads(id) ON DELETE CASCADE,
	user_id uuid NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
	role thread_member_role NOT NULL DEFAULT 'member',
	joined_at timestamptz NOT NULL DEFAULT now(),
	last_read_at timestamptz,
	PRIMARY KEY (thread_id, user_id)
);
CREATE INDEX IF NOT EXISTS thread_members_user_idx ON thread_members(user_id);

CREATE TABLE IF NOT EXISTS thread_messages (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	thread_id uuid NOT NULL REFERENCES course_threads(id) ON DELETE CASCADE,
	sender_id uuid NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
	content_html text NOT NULL,
	content_text text,
	attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz,
	deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS thread_messages_thread_created_idx ON thread_messages(thread_id, created_at);
CREATE INDEX IF NOT EXISTS thread_messages_sender_idx ON thread_messages(sender_id);
