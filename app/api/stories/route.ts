import { NextResponse } from 'next/server'
import db from '@/db/drizzle'
import { isAdmin } from '@/lib/admin'
import { stories } from '@/db/schema'
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
		id: stories.id,
		lessonId: stories.lessonId,
		content: stories.content,
		contentPlain: stories.contentPlain,
		audio: stories.audio,
		// TODO add to this list
	} as const

	const sortColumn =
		columnMap[sortField as keyof typeof columnMap] || stories.lessonId
	const sortDirection = sortOrder === 'DESC' ? desc : asc

	// Filtering
	const filters: any[] = []
	if (filter.id && Array.isArray(filter.id))
		filters.push(inArray(stories.id, filter.id))
	if (filter.lessonId)
		filters.push(sql`${stories.lessonId} = ${filter.lessonId}`)
	if (filter.content)
		filters.push(sql`${stories.content} ILIKE ${'%' + filter.content + '%'}`)

	const whereClause =
		filters.length > 0 ? sql.join(filters, sql` AND `) : undefined

	// Query
	const rows = await db.query.stories.findMany({
		where: whereClause,
		orderBy: sortDirection(sortColumn),
		limit: filter.id ? undefined : perPage,
		offset: filter.id ? undefined : offset,
	})

	// Count
	const [{ count }] = await db
		.select({ count: sql<number>`count(*)` })
		.from(stories)
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

	const data = await db.insert(stories).values(body).returning()

	return NextResponse.json(data[0])
}
