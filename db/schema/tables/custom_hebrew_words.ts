// db/schema/tables/custom_hebrew_words.ts
import { sql } from 'drizzle-orm'
import { pgTable, text, integer, uuid, check } from 'drizzle-orm/pg-core'
import { customHebrewBooks } from './custom_hebrew_books'
import { customHebrewChapters } from './custom_hebrew_chapters'
import { customHebrewVerses } from './custom_hebrew_verses'
import { hebrewLexemes } from './hebrew_lexemes'
import { customHebrewLexemes } from './custom_hebrew_lexemes'

export const customHebrewWords = pgTable(
	'custom_hebrew_words',
	{
		// pattern: `${bookId}-${chapterNumber}-${verseNumber}-${wordSeq}`
		id: text('id').primaryKey().notNull(),

		bookId: integer('book_id')
			.notNull()
			.references(() => customHebrewBooks.id, { onDelete: 'cascade' }),

		chapterId: text('chapter_id')
			.notNull()
			.references(() => customHebrewChapters.id, { onDelete: 'cascade' }),

		verseId: text('verse_id')
			.notNull()
			.references(() => customHebrewVerses.id, { onDelete: 'cascade' }),

		wordSeq: integer('word_seq').notNull(), // position in verse

		// original surface (exactly as admin pasted it, per segment)
		surface: text('surface').notNull(),

		// normalized consonantal form used for matching
		consonants: text('consonants').notNull(),

		// link to the global (biblical) lexeme dictionary
		lexemeId: uuid('lexeme_id').references(() => hebrewLexemes.id, {
			onDelete: 'restrict',
		}),

		// link to custom lexeme dictionary (for new curriculum words)
		customLexemeId: uuid('custom_lexeme_id').references(
			() => customHebrewLexemes.id,
			{
				onDelete: 'restrict',
			}
		),

		// (optional) tags / flags if you want later
		// tags: text('tags').array(),
	},
	(table) => [
		check(
			'custom_hebrew_words_exactly_one_lexeme_ref',
			sql`((CASE WHEN ${table.lexemeId} IS NULL THEN 0 ELSE 1 END) + (CASE WHEN ${table.customLexemeId} IS NULL THEN 0 ELSE 1 END)) = 1`
		),
	]
)
