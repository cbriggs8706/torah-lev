// db/schema/relations/hebrewVocab.relations.ts
import { relations } from 'drizzle-orm'
import { hebrewVocab } from '../tables/hebrewVocab'
import { lessonHebrewVocab } from '../tables/lessonHebrewVocab'

export const hebrewVocabRelations = relations(hebrewVocab, ({ many }) => ({
	lessonConnections: many(lessonHebrewVocab),
}))
