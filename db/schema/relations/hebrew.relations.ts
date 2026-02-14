// db/schema/relations/hebrew.relations.ts

import { relations } from 'drizzle-orm'
import { hebrewBooks } from '../tables/hebrew_books'
import { hebrewChapters } from '../tables/hebrew_chapters'
import { hebrewVerses } from '../tables/hebrew_verses'
import { hebrewWords } from '../tables/hebrew_words'

export const hebrewBookRelations = relations(hebrewBooks, ({ many }) => ({
	chapters: many(hebrewChapters),
	verses: many(hebrewVerses),
	words: many(hebrewWords),
}))

export const hebrewChapterRelations = relations(
	hebrewChapters,
	({ one, many }) => ({
		book: one(hebrewBooks, {
			fields: [hebrewChapters.bookId],
			references: [hebrewBooks.id],
		}),
		verses: many(hebrewVerses),
		words: many(hebrewWords),
	})
)

export const hebrewVerseRelations = relations(
	hebrewVerses,
	({ one, many }) => ({
		book: one(hebrewBooks, {
			fields: [hebrewVerses.bookId],
			references: [hebrewBooks.id],
		}),
		chapter: one(hebrewChapters, {
			fields: [hebrewVerses.chapterId],
			references: [hebrewChapters.id],
		}),
		words: many(hebrewWords),
	})
)

export const hebrewWordRelations = relations(hebrewWords, ({ one }) => ({
	book: one(hebrewBooks, {
		fields: [hebrewWords.bookId],
		references: [hebrewBooks.id],
	}),
	chapter: one(hebrewChapters, {
		fields: [hebrewWords.chapterId],
		references: [hebrewChapters.id],
	}),
	verse: one(hebrewVerses, {
		fields: [hebrewWords.verseId],
		references: [hebrewVerses.id],
	}),
}))
