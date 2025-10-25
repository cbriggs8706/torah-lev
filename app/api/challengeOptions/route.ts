import { NextResponse } from 'next/server'
import db from '@/db/drizzle'
import { isAdmin } from '@/lib/admin'
import { challengeOptions } from '@/db/schema'
import { asc, desc, sql } from 'drizzle-orm'

export const GET = async (req: Request) => {
	if (!isAdmin()) {
		return new NextResponse('Unauthorized', { status: 401 })
	}

	const { searchParams } = new URL(req.url)

	// ✅ Parse query params safely
	const sortRaw = searchParams.get('sort')
	const rangeRaw = searchParams.get('range')
	const filterRaw = searchParams.get('filter')

	let sort: [string, string] = ['id', 'ASC']
	let range: [number, number] = [0, 9]
	let filter: Record<string, unknown> = {}

	try {
		if (sortRaw) sort = JSON.parse(sortRaw)
		if (rangeRaw) range = JSON.parse(rangeRaw)
		if (filterRaw) filter = JSON.parse(filterRaw)
	} catch {
		return new NextResponse('Invalid query parameters', { status: 400 })
	}

	const [sortField, sortOrder] = sort
	const [start, end] = range
	const perPage = end - start + 1
	const offset = start

	const columnMap = {
		id: challengeOptions.id,
		text: challengeOptions.text,
		correct: challengeOptions.correct,
		challengeId: challengeOptions.challengeId,
		imageSrc: challengeOptions.imageSrc,
		audioSrc: challengeOptions.audioSrc,
	} as const

	const sortColumn =
		columnMap[sortField as keyof typeof columnMap] ?? challengeOptions.id
	const sortDirection = sortOrder?.toUpperCase() === 'DESC' ? desc : asc

	// ✅ Build filters safely
	const filters: any[] = []

	if (typeof filter.text === 'string' && filter.text.trim().length > 0) {
		filters.push(sql`${challengeOptions.text} ILIKE ${'%' + filter.text + '%'}`)
	}

	if (filter.challengeId !== undefined && !isNaN(Number(filter.challengeId))) {
		filters.push(
			sql`${challengeOptions.challengeId} = ${Number(filter.challengeId)}`
		)
	}

	if (filter.correct !== undefined) {
		filters.push(sql`${challengeOptions.correct} = ${filter.correct}`)
	}

	const whereClause =
		filters.length > 0 ? sql.join(filters, sql` AND `) : sql`TRUE`

	// ✅ Fetch paginated rows
	const rows = await db.query.challengeOptions.findMany({
		where: whereClause,
		orderBy: sortDirection(sortColumn),
		limit: perPage,
		offset,
	})

	// ✅ Count total (for React-Admin pagination)
	const [{ count }] = await db
		.select({ count: sql<number>`count(*)` })
		.from(challengeOptions)
		.where(whereClause)

	return new NextResponse(JSON.stringify(rows), {
		headers: {
			'X-Total-Count': count.toString(),
			'Access-Control-Expose-Headers': 'X-Total-Count',
		},
	})
}
