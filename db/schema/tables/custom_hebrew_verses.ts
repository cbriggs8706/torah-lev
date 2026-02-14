// db/schema/tables/custom_hebrew_verses.ts
import { pgTable, text, integer } from 'drizzle-orm/pg-core'
import { customHebrewBooks } from './custom_hebrew_books'
import { customHebrewChapters } from './custom_hebrew_chapters'

export const customHebrewVerses = pgTable('custom_hebrew_verses', {
	// pattern: `${bookId}-${chapterNumber}-${verseNumber}`
	id: text('id').primaryKey().notNull(),

	bookId: integer('book_id')
		.notNull()
		.references(() => customHebrewBooks.id, { onDelete: 'cascade' }),

	chapterId: text('chapter_id')
		.notNull()
		.references(() => customHebrewChapters.id, { onDelete: 'cascade' }),

	chapterNumber: integer('chapter_number').notNull(),
	verseNumber: integer('verse_number').notNull(),
})
