import { NextResponse } from 'next/server'
import db from '@/db/drizzle'
import { lessons, units } from '@/db/schema'
import { eq, and, asc } from 'drizzle-orm'

// GET /api/courses/[courseId]/lessons
export async function GET(
	_request: Request,
	{ params }: { params: { courseId: string } }
) {
	const courseId = Number(params.courseId)

	if (isNaN(courseId)) {
		return NextResponse.json({ error: 'Invalid courseId' }, { status: 400 })
	}

	// ✅ Perform a join between lessons and units so we can filter by courseId
	const results = await db
		.select({
			id: lessons.id,
			title: lessons.title,
			order: lessons.order,
			unitId: lessons.unitId,
			unitTitle: units.title,
			unitOrder: units.order,
		})
		.from(lessons)
		.innerJoin(units, eq(lessons.unitId, units.id))
		.where(eq(units.courseId, courseId))
		.orderBy(asc(units.order), asc(lessons.order))

	return NextResponse.json(results)
}
