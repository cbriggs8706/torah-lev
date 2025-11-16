// db/schema/tables/lesson_translations.ts
import {
	pgTable,
	uuid,
	text,
	varchar,
	timestamp,
	uniqueIndex,
} from 'drizzle-orm/pg-core'
import { lessons } from './lessons'

export const lessonTranslations = pgTable(
	'lesson_translations',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		lessonId: uuid('lesson_id')
			.notNull()
			.references(() => lessons.id, { onDelete: 'cascade' }),
		locale: varchar('locale', { length: 10 }).notNull(),
		title: text('title').notNull(),
		content: text('content'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
	},
	(t) => ({
		uniqueLocale: uniqueIndex('lesson_locale_unique').on(t.lessonId, t.locale),
	})
)
