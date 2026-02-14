export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { and, eq, inArray } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
	canAccessPrivateCourse,
	canManageCourse,
	getCourseAccessById,
} from '@/lib/courses/access'
import { supabaseDb } from '@/db/client'
import { attendanceRecords, courseOccurrences } from '@/db/schema/tables/course_collaboration'
import { courseEnrollments } from '@/db/schema/tables/courses'
import { upsertAttendance } from '@/db/queries/course-collaboration'
import { attendanceStatus } from '@/db/schema/enums'

const UpsertAttendanceSchema = z.object({
	occurrenceId: z.string().uuid(),
	records: z.array(
		z.object({
			userId: z.string().uuid(),
			status: z.enum(attendanceStatus.enumValues),
			notes: z.string().optional(),
		})
	),
})

export async function GET(
	req: Request,
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

	const { searchParams } = new URL(req.url)
	const occurrenceId = searchParams.get('occurrenceId')
	if (!occurrenceId) {
		return NextResponse.json({ error: 'occurrenceId is required' }, { status: 400 })
	}

	const occurrence = await supabaseDb.query.courseOccurrences.findFirst({
		where: and(
			eq(courseOccurrences.id, occurrenceId),
			eq(courseOccurrences.courseId, courseId)
		),
		columns: { id: true },
	})
	if (!occurrence) {
		return NextResponse.json({ error: 'Occurrence not found' }, { status: 404 })
	}

	const manager = canManageCourse(access, userRole)
	if (!manager && !userId) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	if (manager) {
		const enrollments = await supabaseDb.query.courseEnrollments.findMany({
			where: eq(courseEnrollments.courseId, courseId),
			with: { student: true },
		})
		const userIds = enrollments.map((enrollment) => enrollment.studentId)
		const records =
			userIds.length === 0
				? []
				: await supabaseDb.query.attendanceRecords.findMany({
						where: and(
							eq(attendanceRecords.occurrenceId, occurrenceId),
							inArray(attendanceRecords.userId, userIds)
						),
					})
		const statusByUserId = new Map(records.map((record) => [record.userId, record]))

		return NextResponse.json({
			roster: enrollments.map((enrollment) => ({
				userId: enrollment.studentId,
				name: enrollment.student.name,
				email: enrollment.student.email,
				image: enrollment.student.image,
				status: statusByUserId.get(enrollment.studentId)?.status ?? null,
				notes: statusByUserId.get(enrollment.studentId)?.notes ?? null,
			})),
		})
	}

	const ownRecord = await supabaseDb.query.attendanceRecords.findFirst({
		where: and(
			eq(attendanceRecords.occurrenceId, occurrenceId),
			eq(attendanceRecords.userId, userId!)
		),
	})
	return NextResponse.json({ record: ownRecord ?? null })
}

export async function PUT(
	req: Request,
	context: { params: Promise<{ id: string }> }
) {
	const { id: courseId } = await context.params
	const session = await getServerSession(authOptions)
	if (!session?.user?.id) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}
	const access = await getCourseAccessById(courseId, session.user.id)
	if (!canManageCourse(access, session.user.role)) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const body = await req.json()
	const parsed = UpsertAttendanceSchema.safeParse(body)
	if (!parsed.success) {
		return NextResponse.json(parsed.error.format(), { status: 400 })
	}

	const occurrence = await supabaseDb.query.courseOccurrences.findFirst({
		where: and(
			eq(courseOccurrences.id, parsed.data.occurrenceId),
			eq(courseOccurrences.courseId, courseId)
		),
		columns: { id: true },
	})
	if (!occurrence) {
		return NextResponse.json({ error: 'Occurrence not found' }, { status: 404 })
	}

	await Promise.all(
		parsed.data.records.map((record) =>
			upsertAttendance({
				occurrenceId: parsed.data.occurrenceId,
				userId: record.userId,
				status: record.status,
				notes: record.notes ?? null,
				markedBy: session.user.id,
			})
		)
	)

	return NextResponse.json({ success: true })
}
