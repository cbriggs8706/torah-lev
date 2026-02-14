// db/schema/relations/customhebrew.relations.ts

import { relations } from 'drizzle-orm'

import { customHebrewBooks } from '../tables/custom_hebrew_books'
import { customHebrewChapters } from '../tables/custom_hebrew_chapters'
import { customHebrewVerses } from '../tables/custom_hebrew_verses'
import { customHebrewWords } from '../tables/custom_hebrew_words'
import { customHebrewLexemes } from '../tables/custom_hebrew_lexemes'
import { hebrewLexemes } from '../tables/hebrew_lexemes'

// ------------------------------------
// BOOK RELATIONS
// ------------------------------------
export const customHebrewBookRelations = relations(
	customHebrewBooks,
	({ many }) => ({
		chapters: many(customHebrewChapters),
		verses: many(customHebrewVerses),
		words: many(customHebrewWords),
	})
)

// ------------------------------------
// CHAPTER RELATIONS
// ------------------------------------
export const customHebrewChapterRelations = relations(
	customHebrewChapters,
	({ one, many }) => ({
		book: one(customHebrewBooks, {
			fields: [customHebrewChapters.bookId],
			references: [customHebrewBooks.id],
		}),
		verses: many(customHebrewVerses),
		words: many(customHebrewWords),
	})
)

// ------------------------------------
// VERSE RELATIONS
// ------------------------------------
export const customHebrewVerseRelations = relations(
	customHebrewVerses,
	({ one, many }) => ({
		book: one(customHebrewBooks, {
			fields: [customHebrewVerses.bookId],
			references: [customHebrewBooks.id],
		}),
		chapter: one(customHebrewChapters, {
			fields: [customHebrewVerses.chapterId],
			references: [customHebrewChapters.id],
		}),
		words: many(customHebrewWords),
	})
)

// ------------------------------------
// WORD RELATIONS
// ------------------------------------
export const customHebrewWordRelations = relations(
	customHebrewWords,
	({ one }) => ({
		book: one(customHebrewBooks, {
			fields: [customHebrewWords.bookId],
			references: [customHebrewBooks.id],
		}),
		chapter: one(customHebrewChapters, {
			fields: [customHebrewWords.chapterId],
			references: [customHebrewChapters.id],
		}),
		verse: one(customHebrewVerses, {
			fields: [customHebrewWords.verseId],
			references: [customHebrewVerses.id],
		}),

		// 👇 IMPORTANT: link to the global lexeme dictionary
		lexeme: one(hebrewLexemes, {
			fields: [customHebrewWords.lexemeId],
			references: [hebrewLexemes.id],
		}),
		customLexeme: one(customHebrewLexemes, {
			fields: [customHebrewWords.customLexemeId],
			references: [customHebrewLexemes.id],
		}),
	})
)

export const customHebrewLexemeRelations = relations(
	customHebrewLexemes,
	({ many }) => ({
		words: many(customHebrewWords),
	})
)
