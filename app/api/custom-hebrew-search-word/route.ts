// app/api/custom-hebrew-search-word/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { like, or } from 'drizzle-orm'
import { supabaseDb as db } from '@/db'
import { hebrewWords } from '@/db/schema/tables/hebrew_words'
import {
	normalizeHebrewToConsonants,
	stripNiqqud,
} from '@/lib/hebrew/ingestCustomHebrewText'

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url)
		const q = (searchParams.get('q') || '').trim()

		if (!q) {
			return NextResponse.json({ results: [] })
		}

		const cons = normalizeHebrewToConsonants(q)
		const bare = stripNiqqud(q)

		const rows = await db
			.select({
				id: hebrewWords.id,
				surface: hebrewWords.surface,
				lemma: hebrewWords.lemma,
				lemmaClean: hebrewWords.lemma_clean,
				bookId: hebrewWords.bookId,
				chapterId: hebrewWords.chapterId,
				verseId: hebrewWords.verseId,
				wordSeq: hebrewWords.wordSeq,
			})
			.from(hebrewWords)
			.where(
				or(
					like(hebrewWords.surface, `%${q}%`),
					like(hebrewWords.surface, `%${bare}%`),
					like(hebrewWords.lemma_clean, `%${cons}%`),
					like(hebrewWords.lemma, `%${cons}%`)
				)
			)
			.limit(50)

		return NextResponse.json({ results: rows })
	} catch (err) {
		console.error('custom-hebrew-search-word error:', err)
		return NextResponse.json(
			{ error: 'search_failed', details: String(err) },
			{ status: 500 }
		)
	}
}
