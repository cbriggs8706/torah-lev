// db/schema/tables/lessons.ts
import { pgTable, uuid, integer, text, timestamp } from 'drizzle-orm/pg-core'
import { units } from './units'

export const lessons = pgTable('lessons', {
	id: uuid('id').defaultRandom().primaryKey(),
	unitId: uuid('unit_id')
		.notNull()
		.references(() => units.id, { onDelete: 'cascade' }),
	slug: text('slug').notNull(),
	description: text('description').notNull().default(''),
	order: integer('order').default(0),
	lessonNumber: text('lesson_number').notNull().default(''),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	video: text('video'),
	secondaryVideo: text('secondary_video'),
	lessonScript: text('lesson_script'),
	grammarLesson: text('grammar_lesson'),
	image: text('image'),
})
