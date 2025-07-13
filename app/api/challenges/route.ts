import { NextResponse } from 'next/server'

import db from '@/db/drizzle'
import { isAdmin } from '@/lib/admin'
import { challenges } from '@/db/schema'
import { asc, desc } from 'drizzle-orm'

export const GET = async (req: Request) => {
	if (!isAdmin()) {
		return new NextResponse('Unauthorized', { status: 401 })
	}

	const url = new URL(req.url)
	const sortField = url.searchParams.get('_sort') ?? 'id'
	const sortOrder =
		url.searchParams.get('_order')?.toUpperCase() === 'DESC' ? desc : asc

	// 🧠 Optional: allowlist to prevent injection
	const allowedFields = [
		'id',
		'question',
		'type',
		'lessonId',
		'order',
		'video',
		'image',
		'audio',
		'hebNiqqud',
	]
	if (!allowedFields.includes(sortField)) {
		return new NextResponse(`Invalid sort field: ${sortField}`, { status: 400 })
	}

	const data = await db.query.challenges.findMany({
		orderBy: sortOrder((challenges as any)[sortField]),
	})

	return NextResponse.json(data)
}

export const POST = async (req: Request) => {
	if (!isAdmin()) {
		return new NextResponse('Unauthorized', { status: 401 })
	}

	const body = await req.json()

	const data = await db
		.insert(challenges)
		.values({
			...body,
		})
		.returning()

	return NextResponse.json(data[0])
}
