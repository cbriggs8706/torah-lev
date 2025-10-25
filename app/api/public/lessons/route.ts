import { NextResponse } from 'next/server'
import db from '@/db/drizzle'
import { lessons, units } from '@/db/schema'
import { asc, desc, eq, sql, and } from 'drizzle-orm'
import { isAdmin } from '@/lib/admin'

export const GET = async (req: Request) => {
	console.log('🧩 API /api/public/lessons called')

	const url = new URL(req.url)
	const isPublic = url.pathname.includes('/public')
	const courseId = url.searchParams.get('courseId')

	// ✅ Allow public access if route includes /public
	if (!isPublic && !isAdmin()) {
		return new NextResponse('Unauthorized', { status: 401 })
	}

	const { searchParams } = url
	const sort = JSON.parse(searchParams.get('sort') || `["id","ASC"]`)
	const range = JSON.parse(searchParams.get('range') || '[0,9]')
	const filter = JSON.parse(searchParams.get('filter') || '{}')

	const [sortField, sortOrder] = sort
	const [start, end] = range
	const perPage = end - start + 1
	const offset = start

	// 🔹 Safe column mapping
	const columnMap = {
		id: lessons.id,
		title: lessons.title,
		order: lessons.order,
		unitId: lessons.unitId,
	} as const

	const sortColumn =
		columnMap[sortField as keyof typeof columnMap] || lessons.id
	const sortDirection = sortOrder === 'DESC' ? desc : asc

	// 🔹 Filtering
	const filters: any[] = []
	if (filter.title)
		filters.push(sql`${lessons.title} ILIKE ${'%' + filter.title + '%'}`)
	if (courseId) filters.push(eq(units.courseId, Number(courseId)))

	const whereClause = filters.length > 0 ? and(...filters) : undefined

	try {
		let rows

		if (courseId) {
			// ✅ If courseId is specified, join lessons → units
			rows = await db
				.select({
					id: lessons.id,
					title: lessons.title,
					order: lessons.order,
					unitId: lessons.unitId,
					unitTitle: units.title,
					courseId: units.courseId,
				})
				.from(lessons)
				.innerJoin(units, eq(lessons.unitId, units.id))
				.where(eq(units.courseId, Number(courseId)))
				.orderBy(asc(units.order), asc(lessons.order))
		} else {
			// ✅ Generic lesson list (admin or public)
			rows = await db.query.lessons.findMany({
				where: whereClause,
				orderBy: sortDirection(sortColumn),
				limit: perPage,
				offset,
			})
		}

		const [{ count }] = await db
			.select({ count: sql<number>`count(*)` })
			.from(lessons)
			.where(whereClause ?? sql`TRUE`)

		const res = new NextResponse(JSON.stringify(rows), { status: 200 })
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
	} catch (error) {
		console.error('❌ Error fetching lessons:', error)
		return new NextResponse('Failed to fetch lessons', { status: 500 })
	}
}

export const POST = async (req: Request) => {
	if (!isAdmin()) return new NextResponse('Unauthorized', { status: 401 })

	const raw = await req.json()
	const body = raw?.data ?? raw

	const payload = {
		title: body.title,
		unitId: Number(body.unitId),
		order: Number(body.order),
	}

	const [created] = await db.insert(lessons).values(payload).returning()
	return NextResponse.json(created, { status: 201 })
}
