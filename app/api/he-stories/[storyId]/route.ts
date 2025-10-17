import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import db from '@/db/drizzle'
import { hebrewStories } from '@/db/schema'
import { isAdmin } from '@/lib/admin'

export const GET = async (
	req: Request,
	{ params }: { params: Record<string, string> }
) => {
	if (!isAdmin()) {
		return new NextResponse('Unauthorized', { status: 403 })
	}
	const id = Number(params.challengeOptionId)

	const data = await db.query.hebrewStories.findFirst({
		where: eq(hebrewStories.id, id),
	})

	return NextResponse.json(data)
}

export const PUT = async (
	req: Request,
	{ params }: { params: { storyId: number } }
) => {
	console.log('API Method:', req.method)
	console.log('Matched dynamic route:', params.storyId, req.method)

	if (!isAdmin()) {
		return new NextResponse('Unauthorized', { status: 403 })
	}

	const body = await req.json()
	const data = await db
		.update(hebrewStories)
		.set({
			...body,
		})
		.where(eq(hebrewStories.id, params.storyId))
		.returning()

	return NextResponse.json(data[0])
}

export const DELETE = async (
	req: Request,
	{ params }: { params: { storyId: number } }
) => {
	if (!isAdmin()) {
		return new NextResponse('Unauthorized', { status: 403 })
	}

	const data = await db
		.delete(hebrewStories)
		.where(eq(hebrewStories.id, params.storyId))
		.returning()

	return NextResponse.json(data[0])
}
