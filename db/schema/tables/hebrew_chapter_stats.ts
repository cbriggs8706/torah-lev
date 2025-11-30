import { pgTable, integer, text, jsonb } from 'drizzle-orm/pg-core'
import { hebrewChapters } from './hebrew_chapters'
import { hebrewBooks } from './hebrew_books'

export const hebrewChapterStats = pgTable('hebrew_chapter_stats', {
	chapterId: text('chapter_id')
		.primaryKey()
		.notNull()
		.references(() => hebrewChapters.id, { onDelete: 'cascade' }),

	bookId: integer('book_id')
		.notNull()
		.references(() => hebrewBooks.id, { onDelete: 'cascade' }),

	totalWords: integer('total_words').notNull(),
	distinctLemmas: integer('distinct_lemmas').notNull(),

	lemmaList: jsonb('lemma_list').notNull(), // array of lemmas
})
