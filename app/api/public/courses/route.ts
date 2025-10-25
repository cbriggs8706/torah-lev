import { NextResponse } from 'next/server'
import db from '@/db/drizzle'
import { isAdmin } from '@/lib/admin'
import { courses } from '@/db/schema'
import { asc, desc, sql, inArray } from 'drizzle-orm'

export const GET = async (req: Request) => {
	const url = new URL(req.url)
	const isPublic = url.pathname.includes('/public')

	if (!isPublic && !isAdmin()) {
		return new NextResponse('Unauthorized', { status: 401 })
	}
	const { searchParams } = new URL(req.url)

	const sort = JSON.parse(searchParams.get('sort') || `["id","ASC"]`)
	const range = JSON.parse(searchParams.get('range') || '[0,9]')
	const filter = JSON.parse(searchParams.get('filter') || '{}')

	const [sortField, sortOrder] = sort
	const [start, end] = range
	const perPage = end - start + 1
	const offset = start

	// Map allowed columns
	const columnMap = {
		id: courses.id,
		title: courses.title,
		imageSrc: courses.imageSrc,
	} as const

	const sortColumn =
		columnMap[sortField as keyof typeof columnMap] || courses.id
	const sortDirection = sortOrder === 'DESC' ? desc : asc

	// Filtering
	const filters: any[] = []
	if (filter.id && Array.isArray(filter.id))
		filters.push(inArray(courses.id, filter.id))
	if (filter.title)
		filters.push(sql`${courses.title} ILIKE ${'%' + filter.title + '%'}`)

	const whereClause =
		filters.length > 0 ? sql.join(filters, sql` AND `) : undefined

	// Query
	const rows = await db.query.courses.findMany({
		where: whereClause,
		orderBy: sortDirection(sortColumn),
		limit: filter.id ? undefined : perPage,
		offset: filter.id ? undefined : offset,
	})

	const [{ count }] = await db
		.select({ count: sql<number>`count(*)` })
		.from(courses)
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
	const data = await db.insert(courses).values(body).returning()
	return NextResponse.json(data[0])
}
