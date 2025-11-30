// db/schema/tables/hebrew_words.ts
import { pgTable, text, integer } from 'drizzle-orm/pg-core'
import { hebrewBooks } from './hebrew_books'
import { hebrewChapters } from './hebrew_chapters'
import { hebrewVerses } from './hebrew_verses'

export const hebrewWords = pgTable('hebrew_words', {
	id: text('id').primaryKey().notNull(), // e.g., "1-1-1-3"
	bookId: integer('book_id')
		.notNull()
		.references(() => hebrewBooks.id, { onDelete: 'cascade' }),
	chapterId: text('chapter_id')
		.notNull()
		.references(() => hebrewChapters.id, { onDelete: 'cascade' }),
	verseId: text('verse_id')
		.notNull()
		.references(() => hebrewVerses.id, { onDelete: 'cascade' }),

	wordSeq: integer('word_seq').notNull(),

	// Hebrew data
	surface: text('surface').notNull(), // ברא
	lemmaVocalized: text('lemma_vocalized'), // בָּרָא
	lemma: text('lemma').notNull(), // BR>[
	partOfSpeech: text('part_of_speech'),
	verbStem: text('verb_stem'),
	verbTense: text('verb_tense'),
})
