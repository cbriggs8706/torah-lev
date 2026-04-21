import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { supabaseDb as db } from '@/db'
import { studyGroupSchema } from '@/forms/learningSchemas'
import {
	studyGroupCourses,
	studyGroups,
} from '@/db/schema/tables/study_groups'
import { requireAdminAccess } from '@/lib/admin/requireAdmin'

export async function PATCH(
	req: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const unauthorized = await requireAdminAccess()
	if (unauthorized) return unauthorized

	try {
		const { id } = await params
		const parsed = studyGroupSchema.parse(await req.json())

		const updated = await db.transaction(async (tx) => {
			const [studyGroup] = await tx
				.update(studyGroups)
				.set({
					title: parsed.title,
					activeCourseId: parsed.activeCourseId ?? null,
					updatedAt: new Date(),
				})
				.where(eq(studyGroups.id, id))
				.returning()

			if (!studyGroup) return null

			await tx
				.delete(studyGroupCourses)
				.where(eq(studyGroupCourses.studyGroupId, id))

			if (parsed.courseIds.length) {
				await tx.insert(studyGroupCourses).values(
					parsed.courseIds.map((courseId, index) => ({
						studyGroupId: id,
						courseId,
						sortOrder: index,
					}))
				)
			}

			return studyGroup
		})

		if (!updated) {
			return NextResponse.json(
				{ error: 'Study group not found' },
				{ status: 404 }
			)
		}

		return NextResponse.json({
			...updated,
			courseIds: parsed.courseIds,
		})
	} catch (error) {
		console.error('Failed to update study group', error)
		return NextResponse.json(
			{ error: 'Failed to update study group' },
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
		.delete(studyGroups)
		.where(eq(studyGroups.id, id))
		.returning({ id: studyGroups.id })

	if (!deleted) {
		return NextResponse.json(
			{ error: 'Study group not found' },
			{ status: 404 }
		)
	}

	return NextResponse.json({ success: true })
}
