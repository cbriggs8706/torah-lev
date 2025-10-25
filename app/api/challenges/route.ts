import { NextResponse } from 'next/server'
import db from '@/db/drizzle'
import { challenges } from '@/db/schema'
import { asc, desc, sql, inArray } from 'drizzle-orm'
import { isAdmin } from '@/lib/admin'

export const GET = async (req: Request) => {
	if (!isAdmin()) return new NextResponse('Unauthorized', { status: 401 })

	const { searchParams } = new URL(req.url)

	// 🧩 Parse safely
	let sort: [string, string] = ['id', 'ASC']
	let range: [number, number] = [0, 9]
	let filter: Record<string, unknown> = {}

	try {
		if (searchParams.get('sort')) {
			sort = JSON.parse(searchParams.get('sort') as string)
		}
		if (searchParams.get('range')) {
			range = JSON.parse(searchParams.get('range') as string)
		}
		if (searchParams.get('filter')) {
			filter = JSON.parse(searchParams.get('filter') as string)
		}
	} catch {
		return new NextResponse('Invalid query parameters', { status: 400 })
	}

	const [sortField, sortOrder] = sort
	const [start, end] = range
	const perPage = end - start + 1
	const offset = start

	// 🧭 Column map for sorting
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
		columnMap[sortField as keyof typeof columnMap] ?? challenges.id
	const sortDirection = sortOrder?.toUpperCase() === 'DESC' ? desc : asc

	// 🧠 Filter handling
	let whereClause = sql`TRUE`

	if (filter.id && Array.isArray(filter.id)) {
		// Support React-Admin "getMany" queries
		whereClause = inArray(challenges.id, filter.id.map(Number).filter(Boolean))
	} else if (
		typeof filter.question === 'string' &&
		filter.question.trim() !== ''
	) {
		whereClause = sql`${challenges.question} ILIKE ${
			'%' + filter.question + '%'
		}`
	} else if (filter.lessonId && !isNaN(Number(filter.lessonId))) {
		whereClause = sql`${challenges.lessonId} = ${Number(filter.lessonId)}`
	} else if (filter.type && typeof filter.type === 'string') {
		whereClause = sql`${challenges.type} = ${filter.type}`
	}

	// 📋 Query data
	const rows = await db.query.challenges.findMany({
		where: whereClause,
		orderBy: sortDirection(sortColumn),
		limit: filter.id ? undefined : perPage, // don't paginate getMany calls
		offset: filter.id ? undefined : offset,
	})

	// 📊 Total count (for pagination header)
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
