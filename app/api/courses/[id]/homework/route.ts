export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse } from 'next/server'
import { asc, eq, and, inArray } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseDb } from '@/db/client'
import { canAccessPrivateCourse, getCourseAccessById } from '@/lib/courses/access'
import {
	courseOccurrences,
	occurrenceAssignments,
	assignmentCompletions,
} from '@/db/schema/tables/course_collaboration'

export async function GET(
	_req: Request,
	context: { params: Promise<{ id: string }> }
) {
	const { id: courseId } = await context.params
	const session = await getServerSession(authOptions)
	const userId = session?.user?.id
	const userRole = session?.user?.role

	const access = await getCourseAccessById(courseId, userId)
	if (!canAccessPrivateCourse(access, userRole)) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const occurrences = await supabaseDb.query.courseOccurrences.findMany({
		where: eq(courseOccurrences.courseId, courseId),
		with: {
			assignments: {
				orderBy: [asc(occurrenceAssignments.orderIndex)],
			},
		},
		orderBy: [asc(courseOccurrences.startsAt)],
	})

	const assignmentIds = occurrences.flatMap((occurrence) =>
		occurrence.assignments.map((assignment) => assignment.id)
	)

	let completedSet = new Set<string>()
	if (userId && assignmentIds.length > 0) {
		const rows = await supabaseDb
			.select({ assignmentId: assignmentCompletions.assignmentId })
			.from(assignmentCompletions)
			.where(
				and(
					eq(assignmentCompletions.userId, userId),
					inArray(assignmentCompletions.assignmentId, assignmentIds)
				)
			)
		completedSet = new Set(rows.map((row) => row.assignmentId))
	}

	return NextResponse.json({
		occurrences: occurrences.map((occurrence) => ({
			...occurrence,
			assignments: occurrence.assignments.map((assignment) => ({
				...assignment,
				isCompleted: completedSet.has(assignment.id),
			})),
		})),
	})
}
