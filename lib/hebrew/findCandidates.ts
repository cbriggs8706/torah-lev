// lib/hebrew/findCandidates.ts

import { sql } from 'drizzle-orm'
import { supabaseDb as db } from '@/db'
import { normalizeHebrewToConsonants } from './ingestCustomHebrewText'

/* ----------------------------------------
   TYPES
----------------------------------------- */
export interface Candidate {
	id: string
	surface: string
	lemma: string | null
	lemma_clean: string | null
	book_id?: number
	chapter_id?: string
	verse_id?: string
	word_seq?: number
}

export interface CandidateResults {
	exact: Candidate[]
	strip: Candidate[]
	lemma: Candidate[]
}

/* ----------------------------------------
   MAIN SEARCH FUNCTION
----------------------------------------- */
export async function findCandidates(
	fragment: string
): Promise<CandidateResults> {
	const cons = normalizeHebrewToConsonants(fragment)

	// Simple niqqud-stripper
	const raw = fragment
		.normalize('NFKD')
		.replace(/[\u0591-\u05C7]/g, '')
		.normalize('NFC')

	/* ----------------------------------------
	   HELPER: run a query safely + typed rows
	----------------------------------------- */
	async function runQuery(q: any): Promise<Candidate[]> {
		const result = await db.execute<Record<string, unknown>>(q)

		// Drizzle returns { rows?: [...] } or array depending on the driver
		const rows = (result as any).rows ?? result ?? []

		return rows as Candidate[]
	}

	/* ----------------------------------------
	   1. Exact surface match
	----------------------------------------- */
	const exact = await runQuery(sql`
		SELECT *
		FROM hebrew_words
		WHERE surface = ${fragment}
		ORDER BY book_id, chapter_id, word_seq
	`)

	/* ----------------------------------------
	   2. Strip niqqud match
	----------------------------------------- */
	const strip = await runQuery(sql`
		SELECT *
		FROM hebrew_words
		WHERE replace(surface, 'ְ','') = ${raw}
	`)

	/* ----------------------------------------
	   3. Lemma or lemma_clean match
	----------------------------------------- */
	const lemma = await runQuery(sql`
		SELECT *
		FROM hebrew_words
		WHERE lemma_clean = ${cons}
		   OR lemma = ${cons}
	`)

	return { exact, strip, lemma }
}
