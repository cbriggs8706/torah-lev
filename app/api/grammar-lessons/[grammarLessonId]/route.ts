import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import db from '@/db/drizzle'
import { grammarLessons } from '@/db/schema'
import { isAdmin } from '@/lib/admin'

export const GET = async (
	req: Request,
	{ params }: { params: Promise<Record<string, string>> }
) => {
	const id = Number((await params).grammarLessonId)
	if (isNaN(id)) {
		return new NextResponse('Invalid ID', { status: 400 })
	}

	if (!isAdmin()) {
		return new NextResponse('Unauthorized', { status: 403 })
	}

	const data = await db.query.grammarLessons.findFirst({
		where: eq(grammarLessons.id, id),
	})

	return NextResponse.json(data)
}

export const PUT = async (
	req: Request,
	{ params }: { params: Promise<{ grammarLessonId: number }> }
) => {
	const id = Number((await params).grammarLessonId)
	if (isNaN(id)) {
		return new NextResponse('Invalid ID', { status: 400 })
	}
	if (!isAdmin()) {
		return new NextResponse('Unauthorized', { status: 403 })
	}

	const body = await req.json()
	const data = await db
		.update(grammarLessons)
		.set({
			...body,
		})
		.where(eq(grammarLessons.id, id))
		.returning()

	return NextResponse.json(data[0])
}

export const DELETE = async (
	req: Request,
	{ params }: { params: Promise<{ grammarLessonId: number }> }
) => {
	const id = Number((await params).grammarLessonId)
	if (isNaN(id)) {
		return new NextResponse('Invalid ID', { status: 400 })
	}
	if (!isAdmin()) {
		return new NextResponse('Unauthorized', { status: 403 })
	}

	const data = await db
		.delete(grammarLessons)
		.where(eq(grammarLessons.id, id))
		.returning()

	return NextResponse.json(data[0])
}
