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

function toStoryRecord(row: typeof videos.$inferSelect) {
	return {
		...row,
		video: row.videoUrl,
	}
}

function toStoryPayload(body: Record<string, unknown>) {
	return {
		lessonId: parseOptionalNumber(body.lessonId),
		curriculumId: parseCurriculumIdArray(
			body.curriculumId ?? body.courseId
		),
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

export const GET = async (req: Request) => {
	if (!isAdmin()) return new NextResponse('Unauthorized', { status: 401 })

	const { searchParams } = new URL(req.url)

	const sort = JSON.parse(searchParams.get('sort') || `["storyId","ASC"]`)
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
		curriculumId: videos.curriculumId,
		title: videos.title,
		hebTitle: videos.hebTitle,
		titleTransliteration: videos.titleTransliteration,
		order: videos.order,
		video: videos.videoUrl,
		image: videos.image,
		public: videos.public,
		category: videos.category,
		content: videos.content,
		contentPlain: videos.contentPlain,
		audio: videos.audio,
	} as const

	const sortColumn = columnMap[sortField as keyof typeof columnMap] || videos.lessonId
	const sortDirection = sortOrder === 'DESC' ? desc : asc

	// Filtering
	const filters: any[] = [sql`${videos.type} = 'story'::video_type`]
	if (filter.id && Array.isArray(filter.id))
		filters.push(inArray(videos.id, filter.id))
	if (filter.lessonId)
		filters.push(sql`${videos.lessonId} = ${filter.lessonId}`)
	if (filter.content)
		filters.push(sql`${videos.content} ILIKE ${'%' + filter.content + '%'}`)

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

	return new NextResponse(JSON.stringify(rows.map((row) => toStoryRecord(row))), {
		headers: {
			'X-Total-Count': count.toString(),
			'Access-Control-Expose-Headers': 'X-Total-Count',
		},
	})
}

export const POST = async (req: Request) => {
	if (!isAdmin()) return new NextResponse('Unauthorized', { status: 401 })

	const body = await req.json()

	const data = await db.insert(videos).values(toStoryPayload(body)).returning()

	return NextResponse.json(toStoryRecord(data[0]))
}
