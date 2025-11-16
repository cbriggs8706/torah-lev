// db/schema/tables/lesson_hebrew_vocab.ts
import { pgTable, uuid } from 'drizzle-orm/pg-core'
import { hebrewVocab } from './hebrewVocab'
import { lessons } from './lessons'
import { unique } from 'drizzle-orm/pg-core'

export const lessonHebrewVocab = pgTable(
	'lesson_hebrew_vocab',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		lessonId: uuid('lesson_id')
			.notNull()
			.references(() => lessons.id, { onDelete: 'cascade' }),
		vocabId: uuid('vocab_id')
			.notNull()
			.references(() => hebrewVocab.id, { onDelete: 'cascade' }),
	},
	(table) => ({
		uniqueLessonVocab: unique('lesson_vocab_unique').on(
			table.lessonId,
			table.vocabId
		),
	})
)
