import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { supabaseDb as db } from '@/db'
import { courses } from '@/db/schema/tables/courses'
import { lessons } from '@/db/schema/tables/lessons'
import { courseSchema } from '@/forms/learningSchemas'
import { requireAdminAccess } from '@/lib/admin/requireAdmin'

export async function PATCH(
	req: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const unauthorized = await requireAdminAccess()
	if (unauthorized) return unauthorized

	try {
		const { id } = await params
		const parsed = courseSchema.parse(await req.json())
		const updated = await db.transaction(async (tx) => {
			const [course] = await tx
				.update(courses)
				.set({
					title: parsed.title,
					updatedAt: new Date(),
				})
				.where(eq(courses.id, id))
				.returning()

			if (!course) return null

			if (parsed.lessonIds) {
				const currentlyAssigned = await tx.query.lessons.findMany({
					where: eq(lessons.courseId, id),
				})
				const selected = new Set(parsed.lessonIds)

				for (const lesson of currentlyAssigned) {
					if (!selected.has(lesson.id)) {
						await tx
							.update(lessons)
							.set({ courseId: null, updatedAt: new Date() })
							.where(eq(lessons.id, lesson.id))
					}
				}

				for (const lessonId of parsed.lessonIds) {
					await tx
						.update(lessons)
						.set({ courseId: id, updatedAt: new Date() })
						.where(eq(lessons.id, lessonId))
				}
			}

			return course
		})

		if (!updated) {
			return NextResponse.json(
				{ error: 'Course not found' },
				{ status: 404 }
			)
		}

		return NextResponse.json(updated)
	} catch (error) {
		console.error('Failed to update course', error)
		return NextResponse.json(
			{ error: 'Failed to update course' },
			{ status: 400 }
		)
	}
}

export async function DELETE(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const unauthorized = await requireAdminAccess()
	if (unauthorized) return unauthorized

	const { id } = await params
	const [deleted] = await db
		.delete(courses)
		.where(eq(courses.id, id))
		.returning({ id: courses.id })

	if (!deleted) {
		return NextResponse.json({ error: 'Course not found' }, { status: 404 })
	}

	return NextResponse.json({ success: true })
}
