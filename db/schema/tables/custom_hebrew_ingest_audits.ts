import { pgTable, serial, integer, text, boolean, timestamp } from 'drizzle-orm/pg-core'
import { customHebrewBooks } from './custom_hebrew_books'

export const customHebrewIngestAudits = pgTable('custom_hebrew_ingest_audits', {
	id: serial('id').primaryKey(),
	customHebrewBookId: integer('custom_hebrew_book_id')
		.notNull()
		.references(() => customHebrewBooks.id, { onDelete: 'cascade' }),
	chapterNumber: integer('chapter_number').notNull(),
	actorUserId: text('actor_user_id'),
	status: text('status').notNull(), // IMPORTED | SKIPPED_EXACT_MATCH
	exactBibleMatch: boolean('exact_bible_match').default(false).notNull(),
	verseCount: integer('verse_count').notNull(),
	tokenCount: integer('token_count').notNull(),
	knownTokenCount: integer('known_token_count').notNull(),
	newTokenCount: integer('new_token_count').notNull(),
	overrideCount: integer('override_count').notNull(),
	summary: text('summary'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
})
