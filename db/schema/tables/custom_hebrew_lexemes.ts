import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

export const customHebrewLexemes = pgTable('custom_hebrew_lexemes', {
	id: uuid('id').defaultRandom().primaryKey(),
	lemma: text('lemma').notNull(),
	lemmaClean: text('lemma_clean').notNull().unique(),
	source: varchar('source', { length: 20 }).default('CUSTOM').notNull(),
	notes: text('notes'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
})
