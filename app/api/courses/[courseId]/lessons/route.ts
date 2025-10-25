import { NextResponse } from 'next/server'
import db from '@/db/drizzle'
import { lessons, units } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'

// GET /api/courses/[courseId]/lessons
export async function GET(
	_request: Request,
	{ params }: { params: { courseId: string } }
) {
	// 🧩 Safely parse and validate courseId
	const courseId = Number(params.courseId)
	if (!params.courseId || isNaN(courseId) || courseId <= 0) {
		return NextResponse.json({ error: 'Invalid courseId' }, { status: 400 })
	}

	try {
		// 📚 Join lessons → units, filter by courseId
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

		if (!results.length) {
			return NextResponse.json(
				{ message: 'No lessons found for this course' },
				{ status: 404 }
			)
		}

		return NextResponse.json(results, { status: 200 })
	} catch (error) {
		console.error('Error fetching lessons:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch lessons' },
			{ status: 500 }
		)
	}
}
