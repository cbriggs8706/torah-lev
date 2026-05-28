import { NextResponse } from 'next/server'
import db from '@/db/drizzle'
import { lessons } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'
import { isAdmin } from '@/lib/admin' // ✅ add this import

// GET /api/curriculum/[courseId]/lessons
export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ courseId: string }> }
) {
	const url = new URL(_request.url)
	const isPublic = url.pathname.includes('/public')

	if (!isPublic && !isAdmin()) {
		return new NextResponse('Unauthorized', { status: 401 })
	}

	// 🧩 Safely parse and validate courseId
	const courseId = Number((await params).courseId)
	if (!(await params).courseId || isNaN(courseId) || courseId <= 0) {
		return NextResponse.json({ error: 'Invalid courseId' }, { status: 400 })
	}

	try {
		const results = await db
			.select({
				id: lessons.id,
				title: lessons.title,
				order: lessons.order,
				lessonNumber: lessons.lessonNumber,
				courseId: lessons.courseId,
			})
			.from(lessons)
			.where(eq(lessons.courseId, courseId))
			.orderBy(asc(lessons.order))

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
