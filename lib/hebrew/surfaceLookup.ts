// lib/hebrew/surfaceLookup.ts
import { supabaseDb as db } from '@/db'
import { hebrewWords } from '@/db/schema/tables/hebrew_words'
import { like } from 'drizzle-orm'

export async function checkExistingSurface(surface: string) {
	return db
		.select({
			id: hebrewWords.id,
			surface: hebrewWords.surface,
			lemma: hebrewWords.lemma,
			lemmaClean: hebrewWords.lemma_clean,
		})
		.from(hebrewWords)
		.where(like(hebrewWords.surface, `%${surface}%`))
		.limit(20)
}
