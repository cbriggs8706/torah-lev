import {
	pgTable,
	pgPolicy,
	text,
	integer,
	timestamp,
	bigint,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const gameResults = pgTable(
	'game_results',
	{
		id: bigint('id', { mode: 'bigint' })
			.primaryKey()
			.generatedAlwaysAsIdentity(),
		studyGroupId: integer('study_group_id').notNull(),
		userId: text('user_id').notNull(),
		userName: text('user_name').notNull(),
		points: integer().default(0).notNull(),
		updatedAt: timestamp('updated_at', {
			withTimezone: true,
			mode: 'string',
		}).defaultNow(),
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
