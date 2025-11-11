import {
	pgTable,
	pgPolicy,
	serial,
	text,
	integer,
	timestamp,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const messages = pgTable(
	'messages',
	{
		id: serial().primaryKey().notNull(),
		senderId: text('sender_id').notNull(),
		studyGroupId: integer('study_group_id').notNull(),
		content: text().notNull(),
		createdAt: timestamp('created_at', {
			withTimezone: true,
			mode: 'string',
		}).defaultNow(),
		tempId: text('temp_id'),
	},
	(table) => [
		pgPolicy('Enable read access for all users', {
			as: 'permissive',
			for: 'select',
			to: ['public'],
			using: sql`true`,
		}),
	]
)
