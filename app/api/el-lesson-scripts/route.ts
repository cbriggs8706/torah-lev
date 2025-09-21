import { NextResponse } from 'next/server'
import db from '@/db/drizzle'
import { isAdmin } from '@/lib/admin'
import { greekLessonScripts } from '@/db/schema'
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
		id: greekLessonScripts.id,
		lessonId: greekLessonScripts.lessonId,
		content: greekLessonScripts.content,
		audioSrc: greekLessonScripts.audioSrc,
	} as const

	const sortColumn =
		columnMap[sortField as keyof typeof columnMap] ||
		greekLessonScripts.lessonId
	const sortDirection = sortOrder === 'DESC' ? desc : asc

	// Filtering
	const filters: any[] = []
	if (filter.id && Array.isArray(filter.id))
		filters.push(inArray(greekLessonScripts.id, filter.id))
	if (filter.lessonId)
		filters.push(sql`${greekLessonScripts.lessonId} = ${filter.lessonId}`)
	if (filter.content)
		filters.push(
			sql`${greekLessonScripts.content} ILIKE ${'%' + filter.content + '%'}`
		)

	const whereClause =
		filters.length > 0 ? sql.join(filters, sql` AND `) : undefined

	// Query
	const rows = await db.query.greekLessonScripts.findMany({
		where: whereClause,
		orderBy: sortDirection(sortColumn),
		limit: filter.id ? undefined : perPage,
		offset: filter.id ? undefined : offset,
	})

	// Count
	const [{ count }] = await db
		.select({ count: sql<number>`count(*)` })
		.from(greekLessonScripts)
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

	const body = await req.json()

	const data = await db.insert(greekLessonScripts).values(body).returning()

	return NextResponse.json(data[0])
}
