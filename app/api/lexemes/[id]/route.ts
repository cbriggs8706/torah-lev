import { NextRequest, NextResponse } from 'next/server'
import { supabaseDb as db } from '@/db/client'
import { hebrewLexemes } from '@/db/schema/tables/hebrew_lexemes'
import { eq } from 'drizzle-orm'

export async function GET(
	req: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	const { id } = await context.params

	const result = await db
		.select()
		.from(hebrewLexemes)
		.where(eq(hebrewLexemes.id, id))
		.limit(1)

	if (result.length === 0) {
		return NextResponse.json({ error: 'Lexeme not found' }, { status: 404 })
	}

	return NextResponse.json(result[0])
}

export async function PATCH(
	req: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await context.params
		const body = await req.json()

		const updated = await db
			.update(hebrewLexemes)
			.set({
				lemma: body.lemma,
				lemmaVocalized: body.lemmaVocalized,
				root: body.root,
				partOfSpeech: body.partOfSpeech,
				binyan: body.binyan,
				strongs: body.strongs,
				definition: body.definition,
				glossEnglish: body.glossEnglish,
				glossEspanol: body.glossEspanol,
				glossPortugues: body.glossPortugues,
				glossNetherlands: body.glossNetherlands,
				glossGreek: body.glossGreek,
				notes: body.notes,
				teachingNotes: body.teachingNotes,
				images: body.images,
				audio: body.audio,
				video: body.video,
				ipa: body.ipa,
			})
			.where(eq(hebrewLexemes.id, id))
			.returning()

		return NextResponse.json(updated[0])
	} catch (err) {
		console.error(err)
		return NextResponse.json(
			{ error: 'Failed to update lexeme' },
			{ status: 500 }
		)
	}
}

export async function DELETE(
	req: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await context.params

		await db.delete(hebrewLexemes).where(eq(hebrewLexemes.id, id))

		return NextResponse.json({ success: true })
	} catch (err) {
		console.error(err)
		return NextResponse.json(
			{ error: 'Failed to delete lexeme' },
			{ status: 500 }
		)
	}
}
