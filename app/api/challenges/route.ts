import { NextResponse } from 'next/server'
import db from '@/db/drizzle'
import { challenges } from '@/db/schema'
import { asc, desc, sql, inArray } from 'drizzle-orm'
import { isAdmin } from '@/lib/admin'

export const GET = async (req: Request) => {
	if (!isAdmin()) return new NextResponse('Unauthorized', { status: 401 })

	const { searchParams } = new URL(req.url)

	const sort = JSON.parse(searchParams.get('sort') || `["id","ASC"]`)
	const range = JSON.parse(searchParams.get('range') || '[0,9]')
	const filter = JSON.parse(searchParams.get('filter') || '{}')

	const [sortField, sortOrder] = sort
	const [start, end] = range
	const perPage = end - start + 1
	const offset = start

	const columnMap = {
		id: challenges.id,
		question: challenges.question,
		type: challenges.type,
		lessonId: challenges.lessonId,
		order: challenges.order,
		video: challenges.video,
		image: challenges.image,
		audio: challenges.audio,
		hebNiqqud: challenges.hebNiqqud,
	} as const

	const sortColumn =
		columnMap[sortField as keyof typeof columnMap] || challenges.id
	const sortDirection = sortOrder === 'DESC' ? desc : asc

	// ✅ Filtering logic
	let whereClause = sql`TRUE`
	if (filter.id && Array.isArray(filter.id)) {
		whereClause = inArray(challenges.id, filter.id) // ✅ getMany support
	} else if (filter.question) {
		whereClause = sql`${challenges.question} ILIKE ${
			'%' + filter.question + '%'
		}`
	}

	const rows = await db.query.challenges.findMany({
		where: whereClause,
		orderBy: sortDirection(sortColumn),
		limit: filter.id ? undefined : perPage, // don't paginate getMany calls
		offset: filter.id ? undefined : offset,
	})

	const [{ count }] = await db
		.select({ count: sql<number>`count(*)` })
		.from(challenges)
		.where(whereClause)

	return new NextResponse(JSON.stringify(rows), {
		headers: {
			'X-Total-Count': count.toString(),
			'Access-Control-Expose-Headers': 'X-Total-Count',
		},
	})
}
