import {
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uuid,
} from 'drizzle-orm/pg-core'
import { courses } from './courses'
import { organizations } from './organizations'
import { targetLanguages } from './target_languages'

export const lessons = pgTable(
	'lessons',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		title: text('title').notNull(),
		number: integer('number').notNull(),
		part: text('part').notNull().default(''),
		sortOrder: integer('sort_order').notNull().default(0),
		courseId: uuid('course_id')
			.references(() => courses.id, { onDelete: 'cascade' }),
		organizationId: uuid('organization_id').references(() => organizations.id, {
			onDelete: 'set null',
		}),
		targetLanguageId: uuid('target_language_id')
			.notNull()
			.references(() => targetLanguages.id, { onDelete: 'restrict' }),
		createdAt: timestamp('created_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index('lessons_course_idx').on(table.courseId),
		index('lessons_organization_idx').on(table.organizationId),
		index('lessons_target_language_idx').on(table.targetLanguageId),
		index('lessons_sort_idx').on(table.sortOrder, table.number),
	]
)
