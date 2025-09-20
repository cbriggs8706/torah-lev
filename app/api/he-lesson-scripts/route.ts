import { NextResponse } from 'next/server'
import db from '@/db/drizzle'
import { isAdmin } from '@/lib/admin'
import { hebrewLessonScripts } from '@/db/schema'
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
		id: hebrewLessonScripts.id,
		lessonId: hebrewLessonScripts.lessonId,
		content: hebrewLessonScripts.content,
		contentPlain: hebrewLessonScripts.contentPlain,
		audioSrc: hebrewLessonScripts.audioSrc,
	} as const

	const sortColumn =
		columnMap[sortField as keyof typeof columnMap] ||
		hebrewLessonScripts.lessonId
	const sortDirection = sortOrder === 'DESC' ? desc : asc

	// Filtering
	const filters: any[] = []
	if (filter.id && Array.isArray(filter.id))
		filters.push(inArray(hebrewLessonScripts.id, filter.id))
	if (filter.lessonId)
		filters.push(sql`${hebrewLessonScripts.lessonId} = ${filter.lessonId}`)
	if (filter.content)
		filters.push(
			sql`${hebrewLessonScripts.content} ILIKE ${'%' + filter.content + '%'}`
		)

	const whereClause =
		filters.length > 0 ? sql.join(filters, sql` AND `) : undefined

	// Query
	const rows = await db.query.hebrewLessonScripts.findMany({
		where: whereClause,
		orderBy: sortDirection(sortColumn),
		limit: filter.id ? undefined : perPage,
		offset: filter.id ? undefined : offset,
	})

	// Count
	const [{ count }] = await db
		.select({ count: sql<number>`count(*)` })
		.from(hebrewLessonScripts)
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

	const data = await db.insert(hebrewLessonScripts).values(body).returning()

	return NextResponse.json(data[0])
}
