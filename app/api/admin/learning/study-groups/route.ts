import { NextResponse } from 'next/server'
import { supabaseDb as db } from '@/db'
import { studyGroupSchema } from '@/forms/learningSchemas'
import {
	studyGroupCourses,
	studyGroups,
} from '@/db/schema/tables/study_groups'
import { requireAdminAccess } from '@/lib/admin/requireAdmin'

export async function GET() {
	const unauthorized = await requireAdminAccess()
	if (unauthorized) return unauthorized

	const rows = await db.query.studyGroups.findMany({
		with: {
			studyGroupCourses: {
				with: {
					course: true,
				},
				orderBy: (studyGroupCourses, { asc }) => [
					asc(studyGroupCourses.sortOrder),
				],
			},
		},
		orderBy: (studyGroups, { asc }) => [asc(studyGroups.title)],
	})

	return NextResponse.json(rows)
}

export async function POST(req: Request) {
	const unauthorized = await requireAdminAccess()
	if (unauthorized) return unauthorized

	try {
		const parsed = studyGroupSchema.parse(await req.json())

		const created = await db.transaction(async (tx) => {
			const [studyGroup] = await tx
				.insert(studyGroups)
				.values({
					title: parsed.title,
					activeCourseId: parsed.activeCourseId ?? null,
				})
				.returning()

			if (parsed.courseIds.length) {
				await tx.insert(studyGroupCourses).values(
					parsed.courseIds.map((courseId, index) => ({
						studyGroupId: studyGroup.id,
						courseId,
						sortOrder: index,
					}))
				)
			}

			return studyGroup
		})

		return NextResponse.json(
			{
				...created,
				courseIds: parsed.courseIds,
			},
			{ status: 201 }
		)
	} catch (error) {
		console.error('Failed to create study group', error)
		return NextResponse.json(
			{ error: 'Failed to create study group' },
			{ status: 400 }
		)
	}
}
