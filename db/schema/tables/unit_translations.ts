import {
	pgTable,
	uuid,
	text,
	varchar,
	timestamp,
	uniqueIndex,
} from 'drizzle-orm/pg-core'
import { units } from './units'

export const unitTranslations = pgTable(
	'unit_translations',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		unitId: uuid('unit_id')
			.notNull()
			.references(() => units.id, { onDelete: 'cascade' }),
		locale: varchar('locale', { length: 10 }).notNull(),
		title: text('title').notNull(),
		description: text('description'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
	},
	(t) => ({
		uniqueLocale: uniqueIndex('unit_locale_unique').on(t.unitId, t.locale),
	})
)
