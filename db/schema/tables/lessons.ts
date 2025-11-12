import { pgTable, uuid, integer, text, timestamp } from 'drizzle-orm/pg-core'
import { units } from './units'

export const lessons = pgTable('lessons', {
	id: uuid('id').defaultRandom().primaryKey(),
	unitId: uuid('unit_id')
		.notNull()
		.references(() => units.id, { onDelete: 'cascade' }),
	slug: text('slug').notNull(),
	order: integer('order').default(0),
	lessonNumber: text('lesson_number').notNull().default(''),
	createdAt: timestamp('created_at').defaultNow().notNull(),
})
