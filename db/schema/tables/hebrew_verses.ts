// db/schema/tables/hebrew_verses.ts
import { pgTable, text, integer } from 'drizzle-orm/pg-core'
import { hebrewBooks } from './hebrew_books'
import { hebrewChapters } from './hebrew_chapters'

export const hebrewVerses = pgTable('hebrew_verses', {
	id: text('id').primaryKey().notNull(), // e.g., "1-1-1"
	bookId: integer('book_id')
		.notNull()
		.references(() => hebrewBooks.id, { onDelete: 'cascade' }),
	chapterId: text('chapter_id')
		.notNull()
		.references(() => hebrewChapters.id, { onDelete: 'cascade' }),
	chapterNumber: integer('chapter_number').notNull(),
	verseNumber: integer('verse_number').notNull(),
})
