import { NextResponse } from 'next/server'
import db from '@/db/drizzle'
import { isAdmin } from '@/lib/admin'
import { lessonScripts } from '@/db/schema'
import { asc, desc, sql, inArray } from 'drizzle-orm'

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
		id: lessonScripts.id,
		lessonId: lessonScripts.lessonId,
		content: lessonScripts.content,
		contentPlain: lessonScripts.contentPlain,
		audioSrc: lessonScripts.audioSrc,
	} as const

	const sortColumn =
		columnMap[sortField as keyof typeof columnMap] || lessonScripts.lessonId
	const sortDirection = sortOrder === 'DESC' ? desc : asc

	// Filtering
	const filters: any[] = []
	if (filter.id && Array.isArray(filter.id))
		filters.push(inArray(lessonScripts.id, filter.id))
	if (filter.lessonId)
		filters.push(sql`${lessonScripts.lessonId} = ${filter.lessonId}`)
	if (filter.content)
		filters.push(
			sql`${lessonScripts.content} ILIKE ${'%' + filter.content + '%'}`
		)

	const whereClause =
		filters.length > 0 ? sql.join(filters, sql` AND `) : undefined

	// Query
	const rows = await db.query.lessonScripts.findMany({
		where: whereClause,
		orderBy: sortDirection(sortColumn),
		limit: filter.id ? undefined : perPage,
		offset: filter.id ? undefined : offset,
	})

	// Count
	const [{ count }] = await db
		.select({ count: sql<number>`count(*)` })
		.from(lessonScripts)
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

	const data = await db.insert(lessonScripts).values(body).returning()

	return NextResponse.json(data[0])
}
