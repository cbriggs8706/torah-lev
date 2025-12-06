// db/schema/tables/etcbc.ts
import { pgTable, integer, text, varchar } from 'drizzle-orm/pg-core'

export const etcbcWordsRaw = pgTable('etcbc_words_raw', {
	wordNode: integer('word_node').primaryKey(),

	book: text('book').notNull(),
	chapter: integer('chapter').notNull(),
	verse: integer('verse').notNull(),

	gWordUtf8: text('g_word_utf8'),
	gConsUtf8: text('g_cons_utf8'),
	gWord: text('g_word'),
	gCons: text('g_cons'),

	trailerUtf8: text('trailer_utf8'),
	trailer: text('trailer'),

	sp: varchar('sp', { length: 10 }),
	vs: varchar('vs', { length: 10 }),
	vt: varchar('vt', { length: 10 }),
	gn: varchar('gn', { length: 10 }),
	nu: varchar('nu', { length: 10 }),
	ps: varchar('ps', { length: 10 }),
	st: varchar('st', { length: 5 }),

	prs: text('prs'),
	prsGn: varchar('prs_gn', { length: 10 }),
	prsNu: varchar('prs_nu', { length: 10 }),
	prsPs: varchar('prs_ps', { length: 10 }),

	pfm: text('pfm'),
	vbe: text('vbe'),
	uvf: text('uvf'),
	ls: text('ls'),
	pdp: text('pdp'),

	function: text('function'),
	rela: text('rela'),
	typ: text('typ'),
	domain: text('domain'),

	lexemeNode: integer('lexeme_node'),
})
