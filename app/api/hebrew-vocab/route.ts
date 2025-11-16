// app/api/hebrew-vocab/route.ts
import { NextResponse } from 'next/server'
import { supabaseDb as db } from '@/db/client'
import { hebrewVocab } from '@/db/schema/tables/hebrewVocab'

export async function POST(req: Request) {
	const body = await req.json()
	const result = await db.insert(hebrewVocab).values(body).returning()
	return NextResponse.json({ vocab: result[0] }) // <— wrap it
}

export async function GET() {
	const rows = await db.select().from(hebrewVocab)
	return NextResponse.json(rows)
}
