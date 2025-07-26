import { NextResponse } from 'next/server'
import db from '@/db/drizzle'
import { isAdmin } from '@/lib/admin'
import { challengeOptions } from '@/db/schema'
import { asc, desc, sql, inArray } from 'drizzle-orm'

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
		id: challengeOptions.id,
		text: challengeOptions.text,
		correct: challengeOptions.correct,
		challengeId: challengeOptions.challengeId,
		imageSrc: challengeOptions.imageSrc,
		audioSrc: challengeOptions.audioSrc,
	} as const

	const sortColumn =
		columnMap[sortField as keyof typeof columnMap] || challengeOptions.id
	const sortDirection = sortOrder === 'DESC' ? desc : asc

	// Filtering
	const filters: any[] = []
	if (filter.text)
		filters.push(sql`${challengeOptions.text} ILIKE ${'%' + filter.text + '%'}`)
	if (filter.challengeId)
		filters.push(sql`${challengeOptions.challengeId} = ${filter.challengeId}`)
	if (filter.correct !== undefined)
		filters.push(sql`${challengeOptions.correct} = ${filter.correct}`)

	const whereClause =
		filters.length > 0 ? sql.join(filters, sql` AND `) : undefined

	const rows = await db.query.challengeOptions.findMany({
		where: whereClause,
		orderBy: sortDirection(sortColumn),
		limit: perPage,
		offset,
	})

	const [{ count }] = await db
		.select({ count: sql<number>`count(*)` })
		.from(challengeOptions)
		.where(whereClause ?? sql`TRUE`)

	return new NextResponse(JSON.stringify(rows), {
		headers: {
			'X-Total-Count': count.toString(),
			'Access-Control-Expose-Headers': 'X-Total-Count',
		},
	})
}
