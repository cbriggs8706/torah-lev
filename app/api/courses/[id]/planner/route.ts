export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse } from 'next/server'
import { asc, eq } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseDb } from '@/db/client'
import { canManageCourse, getCourseAccessById } from '@/lib/courses/access'
import {
	courseOccurrences,
	occurrenceAssignments,
} from '@/db/schema/tables/course_collaboration'
import { z } from 'zod'
import { assignmentSourceType } from '@/db/schema/enums'

const PlannerAssignmentSchema = z.object({
	sourceType: z.enum(assignmentSourceType.enumValues),
	unitId: z.string().uuid().nullable().optional(),
	lessonId: z.string().uuid().nullable().optional(),
	chapterRef: z.string().nullable().optional(),
	title: z.string().min(1),
	contentHtml: z.string().nullable().optional(),
	contentText: z.string().nullable().optional(),
	attachments: z.array(z.unknown()).default([]),
	orderIndex: z.number().int().nonnegative().default(0),
})

const PlannerOccurrenceSchema = z.object({
	startsAt: z.string().datetime(),
	endsAt: z.string().datetime().nullable().optional(),
	timezone: z.string().default('America/Denver'),
	title: z.string().nullable().optional(),
	notes: z.string().nullable().optional(),
	isCanceled: z.boolean().default(false),
	attendanceEnabled: z.boolean().default(false),
	assignments: z.array(PlannerAssignmentSchema).default([]),
})

const PlannerPayloadSchema = z.object({
	occurrences: z.array(PlannerOccurrenceSchema),
})

async function authorizeCourseManager(courseId: string) {
	const session = await getServerSession(authOptions)
	if (!session?.user?.id) return null
	const access = await getCourseAccessById(courseId, session.user.id)
	if (!canManageCourse(access, session.user.role)) return null
	return session
}

export async function GET(
	_req: Request,
	context: { params: Promise<{ id: string }> }
) {
	const { id: courseId } = await context.params
	const session = await authorizeCourseManager(courseId)
	if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

	const occurrences = await supabaseDb.query.courseOccurrences.findMany({
		where: eq(courseOccurrences.courseId, courseId),
		with: {
			assignments: {
				orderBy: [asc(occurrenceAssignments.orderIndex)],
			},
		},
		orderBy: [asc(courseOccurrences.startsAt)],
	})

	return NextResponse.json({ occurrences })
}

export async function PUT(
	req: Request,
	context: { params: Promise<{ id: string }> }
) {
	const { id: courseId } = await context.params
	const session = await authorizeCourseManager(courseId)
	if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

	const body = await req.json()
	const parsed = PlannerPayloadSchema.safeParse(body)
	if (!parsed.success) {
		return NextResponse.json(parsed.error.format(), { status: 400 })
	}

	const payload = parsed.data

	await supabaseDb.transaction(async (tx) => {
		await tx
			.delete(courseOccurrences)
			.where(eq(courseOccurrences.courseId, courseId))

		for (const occurrence of payload.occurrences) {
			const [insertedOccurrence] = await tx
				.insert(courseOccurrences)
				.values({
					courseId,
					startsAt: new Date(occurrence.startsAt),
					endsAt: occurrence.endsAt ? new Date(occurrence.endsAt) : null,
					timezone: occurrence.timezone,
					title: occurrence.title ?? null,
					notes: occurrence.notes ?? null,
					isCanceled: occurrence.isCanceled,
					attendanceEnabled: occurrence.attendanceEnabled,
					createdBy: session.user.id,
				})
				.returning({ id: courseOccurrences.id })

			if (occurrence.assignments.length === 0) continue

			await tx.insert(occurrenceAssignments).values(
				occurrence.assignments.map((assignment, index) => ({
					courseId,
					occurrenceId: insertedOccurrence.id,
					sourceType: assignment.sourceType,
					unitId: assignment.unitId ?? null,
					lessonId: assignment.lessonId ?? null,
					chapterRef: assignment.chapterRef ?? null,
					title: assignment.title,
					contentHtml: assignment.contentHtml ?? null,
					contentText: assignment.contentText ?? null,
					attachments: assignment.attachments,
					orderIndex: assignment.orderIndex ?? index,
					createdBy: session.user.id,
				}))
			)
		}
	})

	const occurrences = await supabaseDb.query.courseOccurrences.findMany({
		where: eq(courseOccurrences.courseId, courseId),
		with: {
			assignments: {
				orderBy: [asc(occurrenceAssignments.orderIndex)],
			},
		},
		orderBy: [asc(courseOccurrences.startsAt)],
	})

	return NextResponse.json({ occurrences })
}
