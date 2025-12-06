import { supabaseDb as db } from '@/db/client'
import { hebrewLexemes } from '@/db/schema/tables/hebrew_lexemes'
import { eq, ilike, or } from 'drizzle-orm'

// -------------------------------
// GET ONE LEXEME
// -------------------------------
export async function getLexemeById(id: string) {
	const rows = await db
		.select()
		.from(hebrewLexemes)
		.where(eq(hebrewLexemes.id, id))
		.limit(1)

	return rows[0] ?? null
}

// -------------------------------
// SEARCH LEXEMES
// By lemma, gloss, definition
// -------------------------------
export async function searchLexemes(q: string, limit = 100) {
	const rows = await db
		.select()
		.from(hebrewLexemes)
		.where(
			or(
				ilike(hebrewLexemes.lemma, `%${q}%`),
				ilike(hebrewLexemes.lemmaVocalized, `%${q}%`),
				ilike(hebrewLexemes.glossEnglish, `%${q}%`),
				ilike(hebrewLexemes.definition, `%${q}%`)
			)
		)
		.limit(limit)

	return rows
}

// -------------------------------
// GET MANY (optionally paginated)
// -------------------------------
export async function getLexemes(limit = 500, offset = 0) {
	const rows = await db.select().from(hebrewLexemes).limit(limit).offset(offset)

	return rows
}

// -------------------------------
// CREATE LEXEME
// -------------------------------
export async function createLexeme(data: {
	lemma: string
	lemmaVocalized?: string
	root?: string
	partOfSpeech?: string
	binyan?: string
	definition?: string
	glossEnglish?: string
}) {
	const inserted = await db
		.insert(hebrewLexemes)
		.values({
			lemma: data.lemma,
			lemmaVocalized: data.lemmaVocalized ?? '',
			root: data.root ?? '',
			partOfSpeech: data.partOfSpeech ?? null,
			binyan: data.binyan ?? null,
			definition: data.definition ?? '',
			glossEnglish: data.glossEnglish ?? '',
		})
		.returning()

	return inserted[0]
}

// -------------------------------
// UPDATE LEXEME
// -------------------------------
export async function updateLexeme(
	id: string,
	data: Partial<typeof hebrewLexemes.$inferInsert>
) {
	const updated = await db
		.update(hebrewLexemes)
		.set(data)
		.where(eq(hebrewLexemes.id, id))
		.returning()

	return updated[0]
}

// -------------------------------
// DELETE LEXEME
// -------------------------------
export async function deleteLexeme(id: string) {
	await db.delete(hebrewLexemes).where(eq(hebrewLexemes.id, id))
	return true
}
