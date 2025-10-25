import { NextResponse } from 'next/server'
import db from '@/db/drizzle'
import { isAdmin } from '@/lib/admin'
import { units } from '@/db/schema'
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

	// Allowed columns
	const columnMap = {
		id: units.id,
		title: units.title,
		description: units.description,
		courseId: units.courseId,
		order: units.order,
	} as const

	const sortColumn = columnMap[sortField as keyof typeof columnMap] || units.id
	const sortDirection = sortOrder === 'DESC' ? desc : asc

	// ✅ Filtering
	const filters: any[] = []
	if (filter.id && Array.isArray(filter.id))
		filters.push(inArray(units.id, filter.id))
	if (filter.title)
		filters.push(sql`${units.title} ILIKE ${'%' + filter.title + '%'}`)
	if (filter.courseId) filters.push(sql`${units.courseId} = ${filter.courseId}`)

	const whereClause =
		filters.length > 0 ? sql.join(filters, sql` AND `) : undefined

	// Query
	const rows = await db.query.units.findMany({
		where: whereClause,
		orderBy: sortDirection(sortColumn),
		limit: filter.id ? undefined : perPage,
		offset: filter.id ? undefined : offset,
	})

	const [{ count }] = await db
		.select({ count: sql<number>`count(*)` })
		.from(units)
		.where(whereClause ?? sql`TRUE`)

	const res = new NextResponse(JSON.stringify(rows), { status: 200 })
	res.headers.set(
		'Content-Range',
		`units ${start}-${Math.max(start, end)}/${count}`
	)
	res.headers.set(
		'Access-Control-Expose-Headers',
		'Content-Range, X-Total-Count'
	)
	res.headers.set('X-Total-Count', count.toString())
	return res

	// return new NextResponse(JSON.stringify(rows), {
	// 	headers: {
	// 		'X-Total-Count': count.toString(),
	// 		'Access-Control-Expose-Headers': 'X-Total-Count',
	// 	},
	// })
}

export const POST = async (req: Request) => {
	if (!isAdmin()) return new NextResponse('Unauthorized', { status: 401 })

	const body = await req.json()
	const data = await db.insert(units).values(body).returning()
	return NextResponse.json(data[0])
}
