// db/schema/tables/custom_hebrew_books.ts
import { pgTable, serial, text, integer } from 'drizzle-orm/pg-core'
import { hebrewBooks } from './hebrew_books'

export const customHebrewBooks = pgTable('custom_hebrew_books', {
	id: serial('id').primaryKey(), // separate id space from hebrew_books
	slug: text('slug').notNull().unique(), // e.g. "genesis-teaching-text"
	title: text('title').notNull(), // human-readable name
	description: text('description'),
	source: text('source').default('CUSTOM'), // "CUSTOM" | "BIBLICAL" | "MODERN" | etc.

	// Optional: link to a canonical biblical book if this is a commentary / teaching text
	linkedHebrewBookId: integer('linked_hebrew_book_id').references(
		() => hebrewBooks.id,
		{ onDelete: 'set null' }
	),
})
