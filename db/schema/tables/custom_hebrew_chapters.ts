// db/schema/tables/custom_hebrew_chapters.ts
import { pgTable, text, integer } from 'drizzle-orm/pg-core'
import { customHebrewBooks } from './custom_hebrew_books'

export const customHebrewChapters = pgTable('custom_hebrew_chapters', {
	// pattern: `${bookId}-${chapterNumber}`
	id: text('id').primaryKey().notNull(),

	bookId: integer('book_id')
		.notNull()
		.references(() => customHebrewBooks.id, { onDelete: 'cascade' }),

	chapterNumber: integer('chapter_number').notNull(),
})
