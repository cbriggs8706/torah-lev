import {
	index,
	pgTable,
	text,
	timestamp,
	uuid,
	uniqueIndex,
} from 'drizzle-orm/pg-core'

export const targetLanguages = pgTable(
	'target_languages',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		name: text('name').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index('target_languages_name_idx').on(table.name),
		uniqueIndex('target_languages_name_unique').on(table.name),
	]
)
