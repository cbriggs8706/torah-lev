// db/schema/tables/units.ts
import { pgTable, uuid, integer, text, timestamp } from 'drizzle-orm/pg-core'
import { courses } from './courses'

export const units = pgTable('units', {
	id: uuid('id').defaultRandom().primaryKey(),
	courseId: uuid('course_id')
		.notNull()
		.references(() => courses.id, { onDelete: 'cascade' }),
	slug: text('slug').notNull(),
	order: integer('order').default(0),
	description: text('description'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
})
