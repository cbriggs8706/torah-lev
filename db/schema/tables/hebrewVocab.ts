// db/schema/tables/hebrew_vocab.ts
import { pgTable, uuid, integer, text } from 'drizzle-orm/pg-core'

export const hebrewVocab = pgTable('hebrew_vocab', {
	id: uuid('id').defaultRandom().primaryKey(),
	heb: text('heb').notNull(),
	hebNiqqud: text('hebNiqqud').notNull(),
	eng: text('eng').notNull(),
	engDefinition: text('engDefinition'),
	person: integer('person'),
	gender: text('gender'),
	number: text('number'),
	partOfSpeech: text('partOfSpeech').array(),
	ipa: text('ipa'),
	engTransliteration: text('engTransliteration'),
	dictionaryUrl: text('dictionaryUrl'),
	images: text('images').array(),
	hebAudio: text('hebAudio'),
	synonyms: integer('synonyms').array(),
	antonyms: integer('antonyms').array(),
	strongsNumber: text('strongs'),
	category: text('category'),
	video: text('video'),
	//Make relational
	// scriptures: text('scriptures').array(),
})
