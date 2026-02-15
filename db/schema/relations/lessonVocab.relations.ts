import { relations } from 'drizzle-orm'
import { lessons } from '../tables/lessons'
import {
	lessonNewVocab,
	lessonScriptVocab,
	lessonVocabTerms,
} from '../tables/lesson_vocab'
import { hebrewLexemes } from '../tables/hebrew_lexemes'
import { customHebrewLexemes } from '../tables/custom_hebrew_lexemes'

export const lessonVocabTermRelations = relations(lessonVocabTerms, ({ one, many }) => ({
	biblicalLexeme: one(hebrewLexemes, {
		fields: [lessonVocabTerms.biblicalLexemeId],
		references: [hebrewLexemes.id],
	}),
	customLexeme: one(customHebrewLexemes, {
		fields: [lessonVocabTerms.customLexemeId],
		references: [customHebrewLexemes.id],
	}),
	scriptRows: many(lessonScriptVocab),
	newVocabRows: many(lessonNewVocab),
}))

export const lessonScriptVocabRelations = relations(lessonScriptVocab, ({ one }) => ({
	lesson: one(lessons, {
		fields: [lessonScriptVocab.lessonId],
		references: [lessons.id],
	}),
	term: one(lessonVocabTerms, {
		fields: [lessonScriptVocab.vocabTermId],
		references: [lessonVocabTerms.id],
	}),
}))

export const lessonNewVocabRelations = relations(lessonNewVocab, ({ one }) => ({
	lesson: one(lessons, {
		fields: [lessonNewVocab.lessonId],
		references: [lessons.id],
	}),
	term: one(lessonVocabTerms, {
		fields: [lessonNewVocab.vocabTermId],
		references: [lessonVocabTerms.id],
	}),
}))
