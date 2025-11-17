// app/api/hebrew-vocab/[id]/route.ts
import { NextResponse } from 'next/server'
import { supabaseDb as db } from '@/db/client'
import { hebrewVocab } from '@/db/schema/tables/hebrewVocab'
import { eq } from 'drizzle-orm'

export async function PATCH(
	req: Request,
	context: { params: Promise<{ id: string }> }
) {
	const body = await req.json()
	const { id } = await context.params

	const result = await db
		.update(hebrewVocab)
		.set(body)
		.where(eq(hebrewVocab.id, id))
		.returning()

	return NextResponse.json(result[0])
}
