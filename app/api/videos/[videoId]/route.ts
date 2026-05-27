import { eq, inArray } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import db from '@/db/drizzle'
import { curriculum, lessons, units, videos } from '@/db/schema'
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

function parseOptionalBoolean(value: unknown) {
	return typeof value === 'boolean' ? value : null
}

function toVideoPayload(body: Record<string, unknown>) {
	const requestedType = typeof body.type === 'string' ? body.type : null

	return {
		hebrewLessonScriptId: parseOptionalNumber(body.hebrewLessonScriptId),
		hebrewStoryId: parseOptionalNumber(body.hebrewStoryId),
		lessonId: parseOptionalNumber(body.lessonId),
		courseId: parseCourseIdArray(body.courseId),
		part: parseOptionalNumber(body.part),
		title: typeof body.title === 'string' ? body.title : null,
		hebTitle: typeof body.hebTitle === 'string' ? body.hebTitle : null,
		titleTransliteration:
			typeof body.titleTransliteration === 'string'
				? body.titleTransliteration
				: null,
		order: parseOptionalNumber(body.order),
		videoUrl:
			typeof body.videoUrl === 'string'
				? body.videoUrl
				: typeof body.video === 'string'
					? body.video
					: typeof body.url === 'string'
						? body.url
						: null,
		image: typeof body.image === 'string' ? body.image : null,
		audio: typeof body.audio === 'string' ? body.audio : null,
		audioSrc: typeof body.audioSrc === 'string' ? body.audioSrc : null,
		public: parseOptionalBoolean(body.public),
		category: typeof body.category === 'string' ? body.category : null,
		content: typeof body.content === 'string' ? body.content : null,
		contentPlain:
			typeof body.contentPlain === 'string' ? body.contentPlain : null,
		type: requestedType,
	}
}

async function decorateVideo(row: typeof videos.$inferSelect | undefined) {
	if (!row) return null

	const lesson =
		typeof row.lessonId === 'number'
			? await db.query.lessons.findFirst({
					where: eq(lessons.id, row.lessonId),
					with: {
						unit: {
							with: {
								course: true,
							},
						},
					},
			  })
			: null

	const courses = Array.isArray(row.courseId) && row.courseId.length > 0
		? await db
				.select({
					id: curriculum.id,
					title: curriculum.title,
				})
				.from(curriculum)
				.where(inArray(curriculum.id, row.courseId))
		: []

	return {
		...row,
		lessonLabel: lesson
			? `${lesson.unit?.course?.title ?? 'Course'} > ${lesson.unit?.title ?? 'Unit'} > ${
					lesson.lessonNumber || lesson.order
			  } - ${lesson.title}`
			: null,
		courseTitles: courses.map((course) => course.title).join(', '),
	}
}

export const GET = async (
	req: Request,
	{ params }: { params: Promise<Record<string, string>> }
) => {
	if (!isAdmin()) {
		return new NextResponse('Unauthorized', { status: 403 })
	}

	const id = Number((await params).videoId)
	const row = await db.query.videos.findFirst({
		where: eq(videos.id, id),
	})

	return NextResponse.json(await decorateVideo(row))
}

export const PUT = async (
	req: Request,
	{ params }: { params: Promise<{ videoId: string }> }
) => {
	if (!isAdmin()) {
		return new NextResponse('Unauthorized', { status: 403 })
	}

	const id = Number((await params).videoId)
	const body = await req.json()
	const [updated] = await db
		.update(videos)
		.set(toVideoPayload(body))
		.where(eq(videos.id, id))
		.returning()

	return NextResponse.json(await decorateVideo(updated))
}

export const DELETE = async (
	req: Request,
	{ params }: { params: Promise<{ videoId: string }> }
) => {
	if (!isAdmin()) {
		return new NextResponse('Unauthorized', { status: 403 })
	}

	const id = Number((await params).videoId)
	const [deleted] = await db.delete(videos).where(eq(videos.id, id)).returning()

	return NextResponse.json(await decorateVideo(deleted))
}
