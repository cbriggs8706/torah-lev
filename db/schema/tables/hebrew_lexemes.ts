// db/schema/tables/hebrew_lexemes.ts
import { pgTable, uuid, integer, text, varchar } from 'drizzle-orm/pg-core'

export const hebrewLexemes = pgTable('hebrew_lexemes', {
	id: uuid('id').defaultRandom().primaryKey(),
	lemma: text('lemma').notNull().unique(),
	lemmaVocalized: text('lemma_vocalized'),
	root: text('root'),
	partOfSpeech: varchar('part_of_speech', { length: 20 }),
	binyan: varchar('binyan', { length: 20 }),
	strongs: varchar('strongs', { length: 10 }),

	definition: text('definition'),
	synonyms: uuid('synonyms').array(),
	antonyms: uuid('antonyms').array(),
	frequency: integer('frequency'),
	glossEnglish: text('gloss_english'),
	glossTbesh: text('gloss_tbesh'),
	meaningTbesh: text('meaning_tbesh'),
	glossEspanol: text('gloss_espanol'),
	glossPortugues: text('gloss_portugues'),
	glossNetherlands: text('gloss_netherlands'),
	glossGreek: text('gloss_greek'),
	source: varchar('source', { length: 20 }).default('BIBLICAL'),
	notes: text('notes'),
	teachingNotes: text('teaching_notes'),
	images: text('images').array().default([]),
	audio: text('audio').array().default([]),
	video: text('video').array().default([]),
	ipa: text('ipa'),
	lemma_norm: text('lemma_norm'),
	lemma_clean: text('lemma_clean'),
})
