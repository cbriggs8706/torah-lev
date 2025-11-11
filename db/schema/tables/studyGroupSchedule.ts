import {
	pgTable,
	pgPolicy,
	text,
	timestamp,
	boolean,
	bigint,
	index,
	jsonb,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const studyGroupSchedule = pgTable(
	'study_group_schedule',
	{
		id: bigint('id', { mode: 'bigint' })
			.primaryKey()
			.generatedAlwaysAsIdentity(),
		// You can use { mode: "bigint" } if numbers are exceeding js number limitations
		studyGroupId: bigint('study_group_id', { mode: 'number' }).notNull(),
		classDate: timestamp('class_date', {
			withTimezone: true,
			mode: 'string',
		}).notNull(),
		notes: text(),
		homeworkInstructions: text('homework_instructions'),
		homeworkLinks: text('homework_links').array(),
		isCanceled: boolean('is_canceled').default(false).notNull(),
		createdAt: timestamp('created_at', {
			withTimezone: true,
			mode: 'string',
		}).defaultNow(),
		updatedAt: timestamp('updated_at', {
			withTimezone: true,
			mode: 'string',
		}).defaultNow(),
		homeworkLinksJson: jsonb('homework_links_json'),
		recordingLink: text('recording_link'),
	},
	(table) => [
		index('idx_study_group_schedule_group').using(
			'btree',
			table.studyGroupId.asc().nullsLast().op('int8_ops')
		),
		pgPolicy('Enable read access for all users', {
			as: 'permissive',
			for: 'select',
			to: ['public'],
			using: sql`true`,
		}),
	]
)
