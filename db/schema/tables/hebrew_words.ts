// db/schema/tables/hebrew_words.ts
import { pgTable, text, integer, uuid } from 'drizzle-orm/pg-core'
import { hebrewBooks } from './hebrew_books'
import { hebrewChapters } from './hebrew_chapters'
import { hebrewVerses } from './hebrew_verses'
import { hebrewLexemes } from './hebrew_lexemes'

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
	surface: text('surface').notNull(), // רֵאשִׁ֖ית all cantillation
	lemmaVocalized: text('lemma_vocalized'), //only vowels רֵאשִׁית
	lemma: text('lemma').notNull(), // BR>[
	partOfSpeech: text('part_of_speech'), // verb, noun
	verbStem: text('verb_stem'), // qal, hif
	verbTense: text('verb_tense'), // perf, wayq, ptca, impf
	root: text('root'), // RSH>
	person: integer('person'),
	gender: text('gender'),
	number: text('number'),
	tags: text('tags').array(),
	lexemeId: uuid('lexeme_id').references(() => hebrewLexemes.id, {
		onDelete: 'set null',
	}),
	lemma_norm: text('lemma_norm'),
	lemma_clean: text('lemma_clean'),
})
