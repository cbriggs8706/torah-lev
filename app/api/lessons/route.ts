import { NextResponse } from 'next/server'
import db from '@/db/drizzle'
import { lessons } from '@/db/schema'
import { asc, desc, eq, sql } from 'drizzle-orm'
import { isAdmin } from '@/lib/admin'

export const GET = async (req: Request) => {
	console.log('API /api/lessons called with method:', req.method)

	const url = new URL(req.url)
	const isPublic = url.pathname.includes('/public')

	if (!isPublic && !isAdmin()) {
		return new NextResponse('Unauthorized', { status: 401 })
	}

	const { searchParams } = new URL(req.url)

	// Parse RA params
	const sort = JSON.parse(searchParams.get('sort') || `["id","ASC"]`)
	const range = JSON.parse(searchParams.get('range') || '[0,9]')
	const filter = JSON.parse(searchParams.get('filter') || '{}')

	const [sortField, sortOrder] = sort
	const [start, end] = range
	const perPage = end - start + 1
	const offset = start

	// Map sort field safely
	const columnMap = {
		id: lessons.id,
		title: lessons.title,
		order: lessons.order,
		unitId: lessons.unitId,
	} as const

	const sortColumn =
		columnMap[sortField as keyof typeof columnMap] || lessons.id
	const sortDirection = sortOrder === 'DESC' ? desc : asc

	// Filtering pattern for a single possible filter
	let whereClause = undefined
	if (filter.title) {
		whereClause = sql`${lessons.title} ILIKE ${'%' + filter.title + '%'}`
	}

	// Query
	const rows = await db.query.lessons.findMany({
		where: whereClause,
		orderBy: sortDirection(sortColumn),
		limit: perPage,
		offset,
	})

	const [{ count }] = await db
		.select({ count: sql<number>`count(*)` })
		.from(lessons)
		.where(whereClause ?? sql`TRUE`)

	const res = new NextResponse(JSON.stringify(rows), { status: 200 })
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

	const raw = await req.json()
	const body = raw?.data ?? raw // support both provider shapes

	const payload = {
		title: body.title,
		unitId: Number(body.unitId),
		order: Number(body.order),
	}

	const [created] = await db.insert(lessons).values(payload).returning()
	// RA requires an `id` field in the response
	return NextResponse.json(created, { status: 201 })
}
