export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canAccessPrivateCourse, getCourseAccessById } from '@/lib/courses/access'
import {
	markAssignmentComplete,
	unmarkAssignmentComplete,
} from '@/db/queries/course-collaboration'
import { supabaseDb } from '@/db/client'
import { occurrenceAssignments } from '@/db/schema/tables/course_collaboration'

async function validateAccess(courseId: string) {
	const session = await getServerSession(authOptions)
	if (!session?.user?.id) {
		return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
	}

	const access = await getCourseAccessById(courseId, session.user.id)
	if (!canAccessPrivateCourse(access, session.user.role)) {
		return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
	}

	return { session }
}

async function validateAssignment(courseId: string, assignmentId: string) {
	const assignment = await supabaseDb.query.occurrenceAssignments.findFirst({
		where: and(
			eq(occurrenceAssignments.id, assignmentId),
			eq(occurrenceAssignments.courseId, courseId)
		),
		columns: { id: true },
	})
	return assignment
}

export async function POST(
	_req: Request,
	context: { params: Promise<{ id: string; assignmentId: string }> }
) {
	const { id: courseId, assignmentId } = await context.params
	const { session, error } = await validateAccess(courseId)
	if (error || !session) return error!

	const assignment = await validateAssignment(courseId, assignmentId)
	if (!assignment) {
		return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
	}

	await markAssignmentComplete(assignmentId, session.user.id)
	return NextResponse.json({ success: true })
}

export async function DELETE(
	_req: Request,
	context: { params: Promise<{ id: string; assignmentId: string }> }
) {
	const { id: courseId, assignmentId } = await context.params
	const { session, error } = await validateAccess(courseId)
	if (error || !session) return error!

	const assignment = await validateAssignment(courseId, assignmentId)
	if (!assignment) {
		return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
	}

	await unmarkAssignmentComplete(assignmentId, session.user.id)
	return NextResponse.json({ success: true })
}
