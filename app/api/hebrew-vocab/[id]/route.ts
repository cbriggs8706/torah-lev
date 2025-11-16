// app/api/hebrew-vocab/[id]/route.ts
import { NextResponse } from 'next/server'
import { supabaseDb as db } from '@/db/client'
import { hebrewVocab } from '@/db/schema/tables/hebrewVocab'
import { eq } from 'drizzle-orm'

export async function PATCH(
	req: Request,
	{ params }: { params: { id: string } }
) {
	const body = await req.json()

	const result = await db
		.update(hebrewVocab)
		.set(body)
		.where(eq(hebrewVocab.id, params.id))
		.returning()

	return NextResponse.json(result[0])
}
