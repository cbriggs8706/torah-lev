import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const organizations = pgTable(
	'organizations',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		title: text('title').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [index('organizations_title_idx').on(table.title)]
)
