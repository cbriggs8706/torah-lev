import { and, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import db from '@/db/drizzle'
import { videos } from '@/db/schema'
import { isAdmin } from '@/lib/admin'

function parseCourseIdArray(value: unknown) {
	if (Array.isArray(value)) {
		return value
			.map((item) => Number(item))
			.filter((item) => Number.isInteger(item))
	}

	if (typeof value === 'string') {
		const normalized = value.trim()
		if (!normalized) return null

		const items = normalized
			.replace(/^\{|\}$/g, '')
			.split(',')
			.map((item) => Number(item.trim()))
			.filter((item) => Number.isInteger(item))

		return items.length > 0 ? items : null
	}

	return null
}

function parseOptionalNumber(value: unknown) {
	if (value === '' || value == null) return null
	const parsed = Number(value)
	return Number.isFinite(parsed) ? parsed : null
}

function toStoryRecord(row: typeof videos.$inferSelect | undefined) {
	return row
		? {
				...row,
				video: row.videoUrl,
			}
		: row
}

function toStoryPayload(body: Record<string, unknown>) {
	return {
		lessonId: parseOptionalNumber(body.lessonId),
		courseId: parseCourseIdArray(body.courseId),
		title: typeof body.title === 'string' ? body.title : null,
		hebTitle: typeof body.hebTitle === 'string' ? body.hebTitle : null,
		titleTransliteration:
			typeof body.titleTransliteration === 'string'
				? body.titleTransliteration
				: null,
		order: parseOptionalNumber(body.order),
		videoUrl:
			typeof body.video === 'string'
				? body.video
				: typeof body.videoUrl === 'string'
					? body.videoUrl
					: null,
		image: typeof body.image === 'string' ? body.image : null,
		audio: typeof body.audio === 'string' ? body.audio : null,
		public: typeof body.public === 'boolean' ? body.public : null,
		category: typeof body.category === 'string' ? body.category : null,
		content: typeof body.content === 'string' ? body.content : null,
		contentPlain:
			typeof body.contentPlain === 'string' ? body.contentPlain : null,
		type: 'story' as const,
	}
}

export const GET = async (
	req: Request,
	{ params }: { params: Promise<Record<string, string>> }
) => {
	if (!isAdmin()) {
		return new NextResponse('Unauthorized', { status: 403 })
	}
	const id = Number((await params).storyId)

	const data = await db.query.videos.findFirst({
		where: and(eq(videos.id, id), eq(videos.type, 'story')),
	})

	return NextResponse.json(toStoryRecord(data))
}

export const PUT = async (
	req: Request,
	{ params }: { params: Promise<{ storyId: number }> }
) => {
	if (!isAdmin()) {
		return new NextResponse('Unauthorized', { status: 403 })
	}

	const body = await req.json()
	const data = await db
		.update(videos)
		.set(toStoryPayload(body))
		.where(and(eq(videos.id, Number((await params).storyId)), eq(videos.type, 'story')))
		.returning()

	return NextResponse.json(toStoryRecord(data[0]))
}

export const DELETE = async (
	req: Request,
	{ params }: { params: Promise<{ storyId: number }> }
) => {
	if (!isAdmin()) {
		return new NextResponse('Unauthorized', { status: 403 })
	}

	const data = await db
		.delete(videos)
		.where(and(eq(videos.id, Number((await params).storyId)), eq(videos.type, 'story')))
		.returning()

	return NextResponse.json(toStoryRecord(data[0]))
}
