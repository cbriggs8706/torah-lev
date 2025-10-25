import { NextResponse } from 'next/server'
import db from '@/db/drizzle'
import { lessons } from '@/db/schema'
import { inArray } from 'drizzle-orm'

export async function POST(req: Request) {
	const { ids } = await req.json()
	if (!Array.isArray(ids) || ids.length === 0) {
		return NextResponse.json([], { status: 200 })
	}

	const data = await db
		.select({ id: lessons.id, title: lessons.title })
		.from(lessons)
		.where(inArray(lessons.id, ids))

	return NextResponse.json(data)
}
