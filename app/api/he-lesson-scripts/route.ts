import { NextResponse } from 'next/server'
import db from '@/db/drizzle'
import { isAdmin } from '@/lib/admin'
import { videos } from '@/db/schema'
import { asc, desc, sql, inArray } from 'drizzle-orm'

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

function toLessonScriptRecord(row: typeof videos.$inferSelect) {
	return {
		...row,
		url: row.videoUrl,
	}
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

export const GET = async (req: Request) => {
	if (!isAdmin()) return new NextResponse('Unauthorized', { status: 401 })

	const { searchParams } = new URL(req.url)

	const sort = JSON.parse(searchParams.get('sort') || `["lessonId","ASC"]`)
	const range = JSON.parse(searchParams.get('range') || '[0,9]')
	const filter = JSON.parse(searchParams.get('filter') || '{}')

	const [sortField, sortOrder] = sort
	const [start, end] = range
	const perPage = end - start + 1
	const offset = start

	// Map allowed columns
	const columnMap = {
		id: videos.id,
		lessonId: videos.lessonId,
		content: videos.content,
		contentPlain: videos.contentPlain,
		audioSrc: videos.audioSrc,
		url: videos.videoUrl,
		type: videos.type,
	} as const

	const sortColumn =
		columnMap[sortField as keyof typeof columnMap] || videos.lessonId
	const sortDirection = sortOrder === 'DESC' ? desc : asc

	// Filtering
	const filters: any[] = [
		sql`${videos.type} IS DISTINCT FROM 'story'::video_type`,
	]
	if (filter.id && Array.isArray(filter.id))
		filters.push(inArray(videos.id, filter.id))
	if (filter.lessonId)
		filters.push(sql`${videos.lessonId} = ${filter.lessonId}`)
	if (filter.content)
		filters.push(sql`${videos.content} ILIKE ${'%' + filter.content + '%'}`)
	if (filter.url)
		filters.push(sql`${videos.videoUrl} ILIKE ${'%' + filter.url + '%'}`)
	if (filter.type)
		filters.push(sql`${videos.type} = ${filter.type}`)

	const whereClause = sql.join(filters, sql` AND `)

	// Query
	const rows = await db.query.videos.findMany({
		where: whereClause,
		orderBy: sortDirection(sortColumn),
		limit: filter.id ? undefined : perPage,
		offset: filter.id ? undefined : offset,
	})

	// Count
	const [{ count }] = await db
		.select({ count: sql<number>`count(*)` })
		.from(videos)
		.where(whereClause)

	const res = new NextResponse(
		JSON.stringify(rows.map((row) => toLessonScriptRecord(row))),
		{ status: 200 }
	)
	// 🔑 Make RA pagination happy
	res.headers.set(
		'Content-Range',
		`lessons ${start}-${Math.max(start, end)}/${count}`
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

	const data = await db
		.insert(videos)
		.values(toLessonScriptPayload(body))
		.returning()

	return NextResponse.json(toLessonScriptRecord(data[0]))
}
