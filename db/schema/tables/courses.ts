import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core'

export const courses = pgTable('courses', {
	id: uuid('id').defaultRandom().primaryKey(),
	slug: text('slug').notNull().unique(),
	imageSrc: text('image_src').notNull(),
	category: text('category'),
	startProficiencyLevel: text('start_proficiency_level'),
	endProficiencyLevel: text('end_proficiency_level'),
	public: boolean('public').notNull().default(true),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
