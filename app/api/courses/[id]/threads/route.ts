export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { and, asc, eq, inArray } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
	canAccessPrivateCourse,
	canManageCourse,
	getCourseAccessById,
} from '@/lib/courses/access'
import { supabaseDb } from '@/db/client'
import { courses, courseEnrollments } from '@/db/schema/tables/courses'
import {
	courseMemberships,
	courseThreads,
	threadMembers,
} from '@/db/schema/tables/course_collaboration'
import { threadType } from '@/db/schema/enums'

const CreateThreadSchema = z.object({
	type: z.enum(threadType.enumValues),
	name: z.string().optional(),
	memberIds: z.array(z.string().uuid()).default([]),
})

async function ensureCourseThread(courseId: string, organizerId?: string | null) {
	let thread = await supabaseDb.query.courseThreads.findFirst({
		where: and(eq(courseThreads.courseId, courseId), eq(courseThreads.type, 'course')),
	})

	if (!thread) {
		;[thread] = await supabaseDb
			.insert(courseThreads)
			.values({
				courseId,
				type: 'course',
				name: 'Course Chat',
				createdBy: organizerId ?? null,
			})
			.returning()
	}

	const enrollments = await supabaseDb.query.courseEnrollments.findMany({
		where: eq(courseEnrollments.courseId, courseId),
		columns: { studentId: true },
	})
	const memberIds = new Set(enrollments.map((enrollment) => enrollment.studentId))
	if (organizerId) memberIds.add(organizerId)
	if (memberIds.size === 0) return thread

	const existing = await supabaseDb.query.threadMembers.findMany({
		where: and(
			eq(threadMembers.threadId, thread.id),
			inArray(threadMembers.userId, Array.from(memberIds))
		),
		columns: { userId: true },
	})
	const existingIds = new Set(existing.map((row) => row.userId))
	const missing = Array.from(memberIds).filter((userId) => !existingIds.has(userId))
	if (missing.length > 0) {
		await supabaseDb.insert(threadMembers).values(
			missing.map((userId) => ({
				threadId: thread.id,
				userId,
				role: userId === organizerId ? 'owner' : 'member',
			}))
		)
	}

	return thread
}

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

	const course = await supabaseDb.query.courses.findFirst({
		where: eq(courses.id, courseId),
		columns: { organizerId: true },
	})
	await ensureCourseThread(courseId, course?.organizerId)

	const manager = canManageCourse(access, userRole)
	if (manager) {
		const threads = await supabaseDb.query.courseThreads.findMany({
			where: eq(courseThreads.courseId, courseId),
			with: {
				members: {
					with: { user: true },
				},
			},
			orderBy: [asc(courseThreads.createdAt)],
		})
		return NextResponse.json({ threads })
	}

	const memberships = await supabaseDb.query.threadMembers.findMany({
		where: eq(threadMembers.userId, userId!),
		with: {
			thread: {
				with: {
					members: { with: { user: true } },
				},
			},
		},
	})
	const threads = memberships
		.map((membership) => membership.thread)
		.filter((thread) => thread.courseId === courseId)
	return NextResponse.json({ threads })
}

export async function POST(
	req: Request,
	context: { params: Promise<{ id: string }> }
) {
	const { id: courseId } = await context.params
	const session = await getServerSession(authOptions)
	if (!session?.user?.id) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}
	const access = await getCourseAccessById(courseId, session.user.id)
	if (!canAccessPrivateCourse(access, session.user.role)) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const body = await req.json()
	const parsed = CreateThreadSchema.safeParse(body)
	if (!parsed.success) {
		return NextResponse.json(parsed.error.format(), { status: 400 })
	}

	const data = parsed.data
	if (data.type === 'course') {
		return NextResponse.json(
			{ error: 'Course thread is managed automatically' },
			{ status: 400 }
		)
	}

	let memberIds = Array.from(new Set([session.user.id, ...data.memberIds]))
	if (data.type === 'dm') {
		memberIds = Array.from(new Set([session.user.id, ...memberIds])).slice(0, 2)
		if (memberIds.length !== 2) {
			return NextResponse.json(
				{ error: 'DM must include exactly two members' },
				{ status: 400 }
			)
		}
	}

	const [enrolledRows, membershipRows, course] = await Promise.all([
		supabaseDb.query.courseEnrollments.findMany({
			where: eq(courseEnrollments.courseId, courseId),
			columns: { studentId: true },
		}),
		supabaseDb.query.courseMemberships.findMany({
			where: eq(courseMemberships.courseId, courseId),
			columns: { userId: true },
		}),
		supabaseDb.query.courses.findFirst({
			where: eq(courses.id, courseId),
			columns: { organizerId: true },
		}),
	])
	const allowedMemberIds = new Set([
		...enrolledRows.map((row) => row.studentId),
		...membershipRows.map((row) => row.userId),
		...(course?.organizerId ? [course.organizerId] : []),
	])
	const invalidMember = memberIds.find((memberId) => !allowedMemberIds.has(memberId))
	if (invalidMember) {
		return NextResponse.json({ error: 'Invalid member selection' }, { status: 400 })
	}

	const [thread] = await supabaseDb
		.insert(courseThreads)
		.values({
			courseId,
			type: data.type,
			name: data.name ?? null,
			createdBy: session.user.id,
		})
		.returning()

	await supabaseDb.insert(threadMembers).values(
		memberIds.map((memberId) => ({
			threadId: thread.id,
			userId: memberId,
			role: memberId === session.user.id ? 'owner' : 'member',
		}))
	)

	const full = await supabaseDb.query.courseThreads.findFirst({
		where: eq(courseThreads.id, thread.id),
		with: {
			members: { with: { user: true } },
		},
	})

	return NextResponse.json({ thread: full }, { status: 201 })
}
