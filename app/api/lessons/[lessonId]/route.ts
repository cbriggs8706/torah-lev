import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import db from '@/db/drizzle'
import { lessons } from '@/db/schema'
import { isAdmin } from '@/lib/admin'

export const GET = async (
	req: Request,
	{ params }: { params: Promise<Record<string, string>> }
) => {
	if (!isAdmin()) {
		return new NextResponse('Unauthorized', { status: 403 })
	}
	const id = Number((await params).lessonId)
	const data = await db.query.lessons.findFirst({
		where: eq(lessons.id, id),
		with: {
			unit: {
				with: {
					course: true,
				},
			},
		},
	})

	return NextResponse.json(
		data
			? {
					...data,
					courseTitle: data.unit?.course?.title ?? null,
					unitTitle: data.unit?.title ?? null,
					lessonLabel: `${data.unit?.course?.title ?? 'Course'} > ${
						data.unit?.title ?? 'Unit'
					} > ${data.lessonNumber || data.order} - ${data.title}`,
			  }
			: null
	)
}

export const PUT = async (
	req: Request,
	{ params }: { params: Promise<{ lessonId: string }> }
) => {
	console.log('API Method:', req.method)
	console.log('Matched dynamic route:', (await params).lessonId, req.method)

	if (!isAdmin()) {
		return new NextResponse('Unauthorized', { status: 403 })
	}
	const id = Number((await params).lessonId)
	const body = await req.json()
	const data = await db
		.update(lessons)
		.set({
			...body,
		})
		.where(eq(lessons.id, id))
		.returning()

	return NextResponse.json(data[0])
}

export const DELETE = async (
	req: Request,
	{ params }: { params: Promise<{ lessonId: string }> }
) => {
	if (!isAdmin()) {
		return new NextResponse('Unauthorized', { status: 403 })
	}
	const id = Number((await params).lessonId)
	const data = await db.delete(lessons).where(eq(lessons.id, id)).returning()

	return NextResponse.json(data[0])
}
