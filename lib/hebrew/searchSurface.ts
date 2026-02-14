// lib/hebrew/searchSurface.ts
import { supabaseDb as db } from '@/db'
import { hebrewWords } from '@/db/schema/tables/hebrew_words'
import { eq } from 'drizzle-orm'

export async function searchSurface(surface: string) {
	return db
		.select()
		.from(hebrewWords)
		.where(eq(hebrewWords.surface, surface))
		.limit(20)
}
