import { NextResponse } from 'next/server'
import db from '@/db/drizzle'
import { isAdmin } from '@/lib/admin'
import { hebrewStories } from '@/db/schema'
import { asc, desc, sql, inArray } from 'drizzle-orm'

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
		id: hebrewStories.id,
		lessonId: hebrewStories.lessonId,
		courseId: hebrewStories.courseId,
		title: hebrewStories.title,
		hebTitle: hebrewStories.hebTitle,
		titleTransliteration: hebrewStories.titleTransliteration,
		order: hebrewStories.order,
		video: hebrewStories.video,
		image: hebrewStories.image,
		public: hebrewStories.public,
		category: hebrewStories.category,
		content: hebrewStories.content,
		contentPlain: hebrewStories.contentPlain,
		audio: hebrewStories.audio,
	} as const

	const sortColumn =
		columnMap[sortField as keyof typeof columnMap] || hebrewStories.lessonId
	const sortDirection = sortOrder === 'DESC' ? desc : asc

	// Filtering
	const filters: any[] = []
	if (filter.id && Array.isArray(filter.id))
		filters.push(inArray(hebrewStories.id, filter.id))
	if (filter.lessonId)
		filters.push(sql`${hebrewStories.lessonId} = ${filter.lessonId}`)
	if (filter.content)
		filters.push(
			sql`${hebrewStories.content} ILIKE ${'%' + filter.content + '%'}`
		)

	const whereClause =
		filters.length > 0 ? sql.join(filters, sql` AND `) : undefined

	// Query
	const rows = await db.query.hebrewStories.findMany({
		where: whereClause,
		orderBy: sortDirection(sortColumn),
		limit: filter.id ? undefined : perPage,
		offset: filter.id ? undefined : offset,
	})

	// Count
	const [{ count }] = await db
		.select({ count: sql<number>`count(*)` })
		.from(hebrewStories)
		.where(whereClause ?? sql`TRUE`)

	return new NextResponse(JSON.stringify(rows), {
		headers: {
			'X-Total-Count': count.toString(),
			'Access-Control-Expose-Headers': 'X-Total-Count',
		},
	})
}

export const POST = async (req: Request) => {
	if (!isAdmin()) return new NextResponse('Unauthorized', { status: 401 })

	const body = await req.json()

	const data = await db.insert(hebrewStories).values(body).returning()

	return NextResponse.json(data[0])
}
