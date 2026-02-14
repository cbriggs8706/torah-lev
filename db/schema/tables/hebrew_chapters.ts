// db/schema/tables/hebrew_chapters.ts
import { pgTable, text, integer } from 'drizzle-orm/pg-core'
import { hebrewBooks } from './hebrew_books'

export const hebrewChapters = pgTable('hebrew_chapters', {
	id: text('id').primaryKey().notNull(), // e.g., "1-1"
	bookId: integer('book_id')
		.notNull()
		.references(() => hebrewBooks.id, { onDelete: 'cascade' }),
	chapterNumber: integer('chapter_number').notNull(),
})
