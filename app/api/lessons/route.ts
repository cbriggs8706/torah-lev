import { NextResponse } from 'next/server'
import db from '@/db/drizzle'
import { courses, lessons, units } from '@/db/schema'
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
		lessonNumber: lessons.lessonNumber,
	} as const

	const sortColumn =
		columnMap[sortField as keyof typeof columnMap] || lessons.id
	const sortDirection = sortOrder === 'DESC' ? desc : asc

	// Filtering pattern for a single possible filter
	let whereClause = undefined
	if (filter.title) {
		whereClause = sql`${lessons.title} ILIKE ${'%' + filter.title + '%'}`
	}
	if (typeof filter.q === 'string' && filter.q.trim()) {
		whereClause = sql`${lessons.title} ILIKE ${'%' + filter.q.trim() + '%'}`
	}

	const rawRows = await db
		.select({
			id: lessons.id,
			title: lessons.title,
			unitId: lessons.unitId,
			order: lessons.order,
			lessonNumber: lessons.lessonNumber,
			unitTitle: units.title,
			unitOrder: units.order,
			courseId: courses.id,
			courseTitle: courses.title,
		})
		.from(lessons)
		.innerJoin(units, eq(lessons.unitId, units.id))
		.innerJoin(courses, eq(units.courseId, courses.id))
		.where(whereClause ?? sql`TRUE`)
		.orderBy(asc(courses.title), asc(units.order), sortDirection(sortColumn))
		.limit(perPage)
		.offset(offset)

	const rows = rawRows.map((lesson) => ({
		...lesson,
		lessonLabel: `${lesson.courseTitle} > ${lesson.unitTitle} > ${
			lesson.lessonNumber || lesson.order
		} - ${lesson.title}`,
		lessonSort: `${lesson.courseTitle}:${String(lesson.unitOrder).padStart(
			4,
			'0'
		)}:${String(lesson.order).padStart(4, '0')}`,
	}))

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
		lessonNumber: body.lessonNumber ?? '',
	}

	const [created] = await db.insert(lessons).values(payload).returning()
	// RA requires an `id` field in the response
	return NextResponse.json(created, { status: 201 })
}
