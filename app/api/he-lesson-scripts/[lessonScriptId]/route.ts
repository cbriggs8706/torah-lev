import { and, eq, sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import db from '@/db/drizzle'
import { videos } from '@/db/schema'
import { isAdmin } from '@/lib/admin'

function parseCurriculumIdArray(value: unknown) {
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

function toLessonScriptRecord(row: typeof videos.$inferSelect | undefined) {
	return row
		? {
				...row,
				url: row.videoUrl,
			}
		: row
}

function toLessonScriptPayload(body: Record<string, unknown>) {
	const requestedType = typeof body.type === 'string' ? body.type : null

	return {
		lessonId: parseOptionalNumber(body.lessonId),
		curriculumId: parseCurriculumIdArray(
			body.curriculumId ?? body.courseId
		),
		part: parseOptionalNumber(body.part),
		content: typeof body.content === 'string' ? body.content : null,
		contentPlain:
			typeof body.contentPlain === 'string' ? body.contentPlain : null,
		audioSrc: typeof body.audioSrc === 'string' ? body.audioSrc : null,
		videoUrl:
			typeof body.url === 'string'
				? body.url
				: typeof body.videoUrl === 'string'
					? body.videoUrl
					: null,
		type:
			requestedType && requestedType !== 'story' ? requestedType : 'lesson',
	}
}

export const GET = async (
	req: Request,
	{ params }: { params: Promise<Record<string, string>> }
) => {
	const id = Number((await params).lessonScriptId)
	if (isNaN(id)) {
		return new NextResponse('Invalid ID', { status: 400 })
	}

	if (!isAdmin()) {
		return new NextResponse('Unauthorized', { status: 403 })
	}

	const data = await db.query.videos.findFirst({
		where: and(
			eq(videos.id, id),
			sql`${videos.type} IS DISTINCT FROM 'story'::video_type`
		),
	})

	return NextResponse.json(toLessonScriptRecord(data))
}

export const PUT = async (
	req: Request,
	{ params }: { params: Promise<{ lessonScriptId: number }> }
) => {
	const id = Number((await params).lessonScriptId)
	if (isNaN(id)) {
		return new NextResponse('Invalid ID', { status: 400 })
	}
	if (!isAdmin()) {
		return new NextResponse('Unauthorized', { status: 403 })
	}

	const body = await req.json()
	const data = await db
		.update(videos)
		.set(toLessonScriptPayload(body))
		.where(
			and(
				eq(videos.id, id),
				sql`${videos.type} IS DISTINCT FROM 'story'::video_type`
			)
		)
		.returning()

	return NextResponse.json(toLessonScriptRecord(data[0]))
}

export const DELETE = async (
	req: Request,
	{ params }: { params: Promise<{ lessonScriptId: number }> }
) => {
	const id = Number((await params).lessonScriptId)
	if (isNaN(id)) {
		return new NextResponse('Invalid ID', { status: 400 })
	}
	if (!isAdmin()) {
		return new NextResponse('Unauthorized', { status: 403 })
	}

	const data = await db
		.delete(videos)
		.where(
			and(
				eq(videos.id, id),
				sql`${videos.type} IS DISTINCT FROM 'story'::video_type`
			)
		)
		.returning()

	return NextResponse.json(toLessonScriptRecord(data[0]))
}
