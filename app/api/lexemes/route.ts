// app/api/lexemes/route.ts

import { NextResponse } from 'next/server'
import { supabaseDb as db } from '@/db/client'
import { hebrewLexemes } from '@/db/schema/tables/hebrew_lexemes'
import { ilike, or } from 'drizzle-orm'

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url)
	const q = searchParams.get('q')

	// If no query, return basic list
	if (!q) {
		const all = await db.select().from(hebrewLexemes).limit(2000)
		return NextResponse.json(all)
	}

	// Search by lemma, gloss, definition
	const results = await db
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
		.limit(200)

	return NextResponse.json(results)
}

export async function POST(req: Request) {
	try {
		const body = await req.json()

		const inserted = await db
			.insert(hebrewLexemes)
			.values({
				lemma: body.lemma,
				lemmaVocalized: body.lemmaVocalized ?? '',
				root: body.root ?? '',
				partOfSpeech: body.partOfSpeech ?? null,
				binyan: body.binyan ?? null,
				definition: body.definition ?? '',
				glossEnglish: body.glossEnglish ?? '',
			})
			.returning()

		return NextResponse.json(inserted[0])
	} catch (err) {
		console.error(err)
		return NextResponse.json(
			{ error: 'Failed to create lexeme' },
			{ status: 500 }
		)
	}
}
