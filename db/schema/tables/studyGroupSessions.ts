import {
	pgTable,
	pgPolicy,
	text,
	integer,
	timestamp,
	unique,
	uuid,
	boolean,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const studyGroupSessions = pgTable(
	'study_group_sessions',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		studyGroupId: integer('study_group_id').notNull(),
		lessonId: integer('lesson_id'),
		lessonTitle: text('lesson_title'),
		isActive: boolean('is_active').default(false),
		startedAt: timestamp('started_at', {
			withTimezone: true,
			mode: 'string',
		}).defaultNow(),
	},
	(table) => [
		unique('study_group_sessions_study_group_id_key').on(table.studyGroupId),
		pgPolicy('Enable read access for all users', {
			as: 'permissive',
			for: 'select',
			to: ['public'],
			using: sql`true`,
		}),
	]
)
