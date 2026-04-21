import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { supabaseDb as db } from '@/db'
import { courses } from '@/db/schema/tables/courses'
import { lessons } from '@/db/schema/tables/lessons'
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
				for (const lessonId of parsed.lessonIds) {
					await tx
						.update(lessons)
						.set({ courseId: course.id, updatedAt: new Date() })
						.where(eq(lessons.id, lessonId))
				}
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
