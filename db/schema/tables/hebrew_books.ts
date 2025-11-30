import { pgTable, integer, text } from 'drizzle-orm/pg-core'
import { bookType } from '../enums'

export const hebrewBooks = pgTable('hebrew_books', {
	id: integer('id').primaryKey().notNull(), // 1–39
	name: text('name').notNull(), // Genesis, Exodus, etc.
	type: bookType('type').notNull().default('SCRIPTURE'),
})
