// db/schema/relations/lessonHebrewVocab.relations.ts
import { relations } from 'drizzle-orm'
import { lessonHebrewVocab } from '../tables/lessonHebrewVocab'
import { lessons } from '../tables/lessons'
import { hebrewVocab } from '../tables/hebrewVocab'

export const lessonHebrewVocabRelations = relations(
	lessonHebrewVocab,
	({ one }) => ({
		lesson: one(lessons, {
			fields: [lessonHebrewVocab.lessonId],
			references: [lessons.id],
		}),
		vocab: one(hebrewVocab, {
			fields: [lessonHebrewVocab.vocabId],
			references: [hebrewVocab.id],
		}),
	})
)
