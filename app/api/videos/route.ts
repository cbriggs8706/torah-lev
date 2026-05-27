import { and, asc, desc, eq, ilike, inArray, sql } from 'drizzle-orm'
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

type VideoRow = typeof videos.$inferSelect

async function decorateVideos(rows: VideoRow[]) {
	const lessonIds = Array.from(
		new Set(
			rows
				.map((row) => row.lessonId)
				.filter((value): value is number => typeof value === 'number')
		)
	)
	const courseIds = Array.from(
		new Set(
			rows.flatMap((row) =>
				Array.isArray(row.courseId)
					? row.courseId.filter((value): value is number => typeof value === 'number')
					: []
			)
		)
	)

	const [lessonRows, courseRows] = await Promise.all([
		lessonIds.length
			? db
					.select({
						id: lessons.id,
						title: lessons.title,
						order: lessons.order,
						lessonNumber: lessons.lessonNumber,
						unitTitle: units.title,
						courseTitle: curriculum.title,
					})
					.from(lessons)
					.innerJoin(units, eq(lessons.unitId, units.id))
					.innerJoin(curriculum, eq(units.courseId, curriculum.id))
					.where(inArray(lessons.id, lessonIds))
			: Promise.resolve([]),
		courseIds.length
			? db
					.select({
						id: curriculum.id,
						title: curriculum.title,
					})
					.from(curriculum)
					.where(inArray(curriculum.id, courseIds))
			: Promise.resolve([]),
	])

	const lessonMap = new Map(
		lessonRows.map((lesson) => [
			lesson.id,
			`${lesson.courseTitle} > ${lesson.unitTitle} > ${
				lesson.lessonNumber || lesson.order
			} - ${lesson.title}`,
		])
	)
	const courseMap = new Map(courseRows.map((course) => [course.id, course.title]))

	return rows.map((row) => ({
		...row,
		lessonLabel:
			typeof row.lessonId === 'number' ? (lessonMap.get(row.lessonId) ?? null) : null,
		courseTitles: Array.isArray(row.courseId)
			? row.courseId
					.map((id) => courseMap.get(id))
					.filter((value): value is string => Boolean(value))
					.join(', ')
			: '',
	}))
}

export const GET = async (req: Request) => {
	if (!isAdmin()) return new NextResponse('Unauthorized', { status: 401 })

	const { searchParams } = new URL(req.url)
	const sort = JSON.parse(searchParams.get('sort') || `["id","ASC"]`)
	const range = JSON.parse(searchParams.get('range') || '[0,9]')
	const filter = JSON.parse(searchParams.get('filter') || '{}')

	const [sortField, sortOrder] = sort
	const [start, end] = range
	const perPage = end - start + 1
	const offset = start

	const columnMap = {
		id: videos.id,
		lessonId: videos.lessonId,
		title: videos.title,
		hebTitle: videos.hebTitle,
		order: videos.order,
		videoUrl: videos.videoUrl,
		type: videos.type,
		category: videos.category,
		public: videos.public,
		part: videos.part,
	} as const

	const sortColumn = columnMap[sortField as keyof typeof columnMap] || videos.id
	const sortDirection = sortOrder === 'DESC' ? desc : asc

	const filters = []
	if (filter.id && Array.isArray(filter.id)) {
		filters.push(inArray(videos.id, filter.id))
	}
	if (filter.lessonId) {
		filters.push(eq(videos.lessonId, Number(filter.lessonId)))
	}
	if (typeof filter.type === 'string' && filter.type.trim()) {
		filters.push(eq(videos.type, filter.type))
	}
	if (typeof filter.title === 'string' && filter.title.trim()) {
		filters.push(ilike(videos.title, `%${filter.title.trim()}%`))
	}
	if (typeof filter.category === 'string' && filter.category.trim()) {
		filters.push(ilike(videos.category, `%${filter.category.trim()}%`))
	}
	if (typeof filter.q === 'string' && filter.q.trim()) {
		const q = `%${filter.q.trim()}%`
		filters.push(
			sql`(
				${videos.title} ILIKE ${q}
				OR ${videos.hebTitle} ILIKE ${q}
				OR ${videos.content} ILIKE ${q}
				OR ${videos.contentPlain} ILIKE ${q}
			)`
		)
	}

	const whereClause =
		filters.length > 0 ? and(...filters) : undefined

	const rows = await db.query.videos.findMany({
		where: whereClause,
		orderBy: sortDirection(sortColumn),
		limit: filter.id ? undefined : perPage,
		offset: filter.id ? undefined : offset,
	})

	const [{ count }] = await db
		.select({ count: sql<number>`count(*)` })
		.from(videos)
		.where(whereClause ?? sql`TRUE`)

	const decoratedRows = await decorateVideos(rows)

	const res = new NextResponse(JSON.stringify(decoratedRows), { status: 200 })
	res.headers.set(
		'Content-Range',
		`videos ${start}-${Math.max(start, end)}/${count}`
	)
	res.headers.set(
		'Access-Control-Expose-Headers',
		'Content-Range, X-Total-Count'
	)
	res.headers.set('X-Total-Count', count.toString())
	return res
}

export const POST = async (req: Request) => {
	if (!isAdmin()) return new NextResponse('Unauthorized', { status: 401 })

	const body = await req.json()
	const [created] = await db
		.insert(videos)
		.values(toVideoPayload(body))
		.returning()

	const [decorated] = await decorateVideos([created])
	return NextResponse.json(decorated, { status: 201 })
}
