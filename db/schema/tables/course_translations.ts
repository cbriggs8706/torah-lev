import {
	pgTable,
	uuid,
	text,
	varchar,
	timestamp,
	uniqueIndex,
} from 'drizzle-orm/pg-core'
import { courses } from './courses'

export const courseTranslations = pgTable(
	'course_translations',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		courseId: uuid('course_id')
			.notNull()
			.references(() => courses.id, { onDelete: 'cascade' }),
		locale: varchar('locale', { length: 10 }).notNull(), // 'en', 'es', 'he'
		title: text('title').notNull(),
		description: text('description'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
	},
	(t) => ({
		uniqueLocale: uniqueIndex('course_locale_unique').on(t.courseId, t.locale),
	})
)
