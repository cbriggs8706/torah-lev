// db/schema/tables/hebrew_vocab_translations.ts
import {
	pgTable,
	uuid,
	varchar,
	text,
	timestamp,
	uniqueIndex,
} from 'drizzle-orm/pg-core'
import { hebrewVocab } from './hebrewVocab'

export const hebrewVocabTranslations = pgTable(
	'hebrew_vocab_translations',
	{
		id: uuid('id').defaultRandom().primaryKey(),

		vocabId: uuid('vocab_id')
			.notNull()
			.references(() => hebrewVocab.id, { onDelete: 'cascade' }),

		locale: varchar('locale', { length: 10 }).notNull(),

		// Localized fields
		word: text('word').notNull(), // for Spanish, Portuguese, etc
		definition: text('definition'),
		transliteration: text('transliteration'),
		notes: text('notes'), // optional field for things like grammar/culture notes

		createdAt: timestamp('created_at').defaultNow().notNull(),
	},
	(t) => ({
		uniqueLocale: uniqueIndex('vocab_locale_unique').on(t.vocabId, t.locale),
	})
)
