import { NextResponse } from 'next/server'
import { supabaseDb as db } from '@/db'
import { courseLessons, courses } from '@/db/schema/tables/courses'
import { courseSchema } from '@/forms/learningSchemas'
import { requireAdminAccess } from '@/lib/admin/requireAdmin'

export async function GET() {
	const unauthorized = await requireAdminAccess()
	if (unauthorized) return unauthorized

	const rows = await db.query.courses.findMany({
		orderBy: (courses, { asc }) => [asc(courses.title)],
	})

	return NextResponse.json(rows)
}

export async function POST(req: Request) {
	const unauthorized = await requireAdminAccess()
	if (unauthorized) return unauthorized

	try {
		const parsed = courseSchema.parse(await req.json())
		const created = await db.transaction(async (tx) => {
			const [course] = await tx
				.insert(courses)
				.values({
					title: parsed.title,
				})
				.returning()

			if (parsed.lessonIds?.length) {
				await tx.insert(courseLessons).values(
					parsed.lessonIds.map((lessonId, index) => ({
						courseId: course.id,
						lessonId,
						sortOrder: index,
					}))
				)
			}

			return course
		})

		return NextResponse.json(created, { status: 201 })
	} catch (error) {
		console.error('Failed to create course', error)
		return NextResponse.json(
			{ error: 'Failed to create course' },
			{ status: 400 }
		)
	}
}
