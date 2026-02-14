import { and, eq } from 'drizzle-orm'
import { supabaseDb as db } from '@/db/client'
import {
	courseMemberships,
	courseOccurrences,
	occurrenceAssignments,
	assignmentCompletions,
	attendanceRecords,
	courseThreads,
	threadMembers,
	threadMessages,
} from '@/db/schema/tables/course_collaboration'

export async function upsertCourseMembership(input: {
	courseId: string
	userId: string
	role: 'organizer' | 'teacher' | 'ta' | 'student'
	invitedBy?: string
}) {
	const [row] = await db
		.insert(courseMemberships)
		.values(input)
		.onConflictDoUpdate({
			target: [courseMemberships.courseId, courseMemberships.userId],
			set: { role: input.role, invitedBy: input.invitedBy ?? null },
		})
		.returning()

	return row
}

export async function getCourseMembership(courseId: string, userId: string) {
	return db.query.courseMemberships.findFirst({
		where: and(
			eq(courseMemberships.courseId, courseId),
			eq(courseMemberships.userId, userId)
		),
	})
}

export async function removeCourseMembership(courseId: string, userId: string) {
	const [row] = await db
		.delete(courseMemberships)
		.where(
			and(
				eq(courseMemberships.courseId, courseId),
				eq(courseMemberships.userId, userId)
			)
		)
		.returning()
	return row ?? null
}

export async function createOccurrence(input: {
	courseId: string
	startsAt: Date
	endsAt?: Date | null
	timezone: string
	title?: string | null
	notes?: string | null
	isCanceled?: boolean
	attendanceEnabled?: boolean
	createdBy?: string
}) {
	const [row] = await db.insert(courseOccurrences).values(input).returning()
	return row
}

export async function createOccurrenceAssignment(input: {
	courseId: string
	occurrenceId: string
	sourceType: 'existing_lesson' | 'existing_chapter' | 'custom'
	unitId?: string | null
	lessonId?: string | null
	chapterRef?: string | null
	title: string
	contentHtml?: string | null
	contentText?: string | null
	attachments?: unknown[]
	orderIndex?: number
	createdBy?: string | null
}) {
	const [row] = await db.insert(occurrenceAssignments).values(input).returning()
	return row
}

export async function markAssignmentComplete(assignmentId: string, userId: string) {
	const [row] = await db
		.insert(assignmentCompletions)
		.values({
			assignmentId,
			userId,
		})
		.onConflictDoUpdate({
			target: [assignmentCompletions.assignmentId, assignmentCompletions.userId],
			set: { updatedAt: new Date(), completedAt: new Date() },
		})
		.returning()

	return row
}

export async function unmarkAssignmentComplete(
	assignmentId: string,
	userId: string
) {
	const [row] = await db
		.delete(assignmentCompletions)
		.where(
			and(
				eq(assignmentCompletions.assignmentId, assignmentId),
				eq(assignmentCompletions.userId, userId)
			)
		)
		.returning()
	return row ?? null
}

export async function upsertAttendance(input: {
	occurrenceId: string
	userId: string
	status: 'present' | 'absent' | 'late'
	markedBy?: string | null
	notes?: string | null
}) {
	const [row] = await db
		.insert(attendanceRecords)
		.values(input)
		.onConflictDoUpdate({
			target: [attendanceRecords.occurrenceId, attendanceRecords.userId],
			set: {
				status: input.status,
				markedBy: input.markedBy ?? null,
				notes: input.notes ?? null,
				markedAt: new Date(),
			},
		})
		.returning()
	return row
}

export async function createThread(input: {
	courseId: string
	type: 'course' | 'dm' | 'group'
	name?: string | null
	createdBy?: string | null
	memberIds: string[]
}) {
	return db.transaction(async (tx) => {
		const [thread] = await tx
			.insert(courseThreads)
			.values({
				courseId: input.courseId,
				type: input.type,
				name: input.name ?? null,
				createdBy: input.createdBy ?? null,
			})
			.returning()

		if (input.memberIds.length > 0) {
			await tx.insert(threadMembers).values(
				input.memberIds.map((memberId, idx) => ({
					threadId: thread.id,
					userId: memberId,
					role: idx === 0 ? 'owner' : 'member',
				}))
			)
		}

		return thread
	})
}

export async function createThreadMessage(input: {
	threadId: string
	senderId: string
	contentHtml: string
	contentText?: string | null
	attachments?: unknown[]
}) {
	const [row] = await db.insert(threadMessages).values(input).returning()
	return row
}
