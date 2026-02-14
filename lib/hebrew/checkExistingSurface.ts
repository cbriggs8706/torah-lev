// lib/hebrew/checkExistingSurface.ts

import { supabaseDb as db } from '@/db'
import { sql } from 'drizzle-orm'
import { normalizeHebrewToConsonants } from './ingestCustomHebrewText'

export async function checkExistingSurface(surface: string) {
	const cons = normalizeHebrewToConsonants(surface)

	const q = await db.execute(sql`
		SELECT *
		FROM hebrew_words
		WHERE surface = ${surface}
		   OR replace(surface, 'ְ','') = ${surface.replace(/[\u0591-\u05C7]/g, '')}
		   OR lemma_clean = ${cons}
	`)

	// drizzle returns either array or {rows: []}
	return 'rows' in q ? q.rows : q
}
