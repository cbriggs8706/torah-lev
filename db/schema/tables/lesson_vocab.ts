import {
	integer,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uuid,
} from 'drizzle-orm/pg-core'
import { lessons } from './lessons'
import { hebrewLexemes } from './hebrew_lexemes'
import { customHebrewLexemes } from './custom_hebrew_lexemes'

export const lessonVocabTerms = pgTable('lesson_vocab_terms', {
	id: uuid('id').defaultRandom().primaryKey(),
	surface: text('surface').notNull(),
	consonants: text('consonants').notNull().unique(),
	biblicalLexemeId: uuid('biblical_lexeme_id').references(() => hebrewLexemes.id, {
		onDelete: 'set null',
	}),
	customLexemeId: uuid('custom_lexeme_id').references(
		() => customHebrewLexemes.id,
		{ onDelete: 'set null' },
	),
	createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const lessonScriptVocab = pgTable(
	'lesson_script_vocab',
	{
		lessonId: uuid('lesson_id')
			.notNull()
			.references(() => lessons.id, { onDelete: 'cascade' }),
		vocabTermId: uuid('vocab_term_id')
			.notNull()
			.references(() => lessonVocabTerms.id, { onDelete: 'cascade' }),
		surfaceInScript: text('surface_in_script').notNull(),
		frequency: integer('frequency').notNull().default(1),
		createdAt: timestamp('created_at').defaultNow().notNull(),
	},
	(table) => [primaryKey({ columns: [table.lessonId, table.vocabTermId] })],
)

export const lessonNewVocab = pgTable(
	'lesson_new_vocab',
	{
		lessonId: uuid('lesson_id')
			.notNull()
			.references(() => lessons.id, { onDelete: 'cascade' }),
		vocabTermId: uuid('vocab_term_id')
			.notNull()
			.references(() => lessonVocabTerms.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at').defaultNow().notNull(),
	},
	(table) => [primaryKey({ columns: [table.lessonId, table.vocabTermId] })],
)
