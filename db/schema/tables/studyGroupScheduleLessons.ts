import { pgTable, pgPolicy, integer, bigint, foreignKey } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { studyGroupSchedule } from './studyGroupSchedule'

export const studyGroupScheduleLessons = pgTable(
	'study_group_schedule_lessons',
	{
		id: bigint('id', { mode: 'bigint' })
			.primaryKey()
			.generatedAlwaysAsIdentity(),
		scheduleId: bigint('schedule_id', { mode: 'number' }).notNull(),
		orderIndex: integer('order_index').default(1),
	},
	(table) => [
		foreignKey({
			columns: [table.scheduleId],
			foreignColumns: [studyGroupSchedule.id],
			name: 'study_group_schedule_lessons_schedule_id_fkey',
		}).onDelete('cascade'),
		pgPolicy('Enable read access for all users', {
			as: 'permissive',
			for: 'select',
			to: ['public'],
			using: sql`true`,
		}),
	]
)
