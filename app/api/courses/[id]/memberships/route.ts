export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canManageCourse, getCourseAccessById } from '@/lib/courses/access'
import { supabaseDb } from '@/db/client'
import { courses } from '@/db/schema/tables/courses'
import { eq } from 'drizzle-orm'
import { courseMemberRole } from '@/db/schema/enums'
import { upsertCourseMembership } from '@/db/queries/course-collaboration'

const UpdateMembershipSchema = z.object({
	userId: z.string().uuid(),
	role: z.enum(courseMemberRole.enumValues),
})

async function authorize(courseId: string) {
	const session = await getServerSession(authOptions)
	if (!session?.user?.id) return null
	const access = await getCourseAccessById(courseId, session.user.id)
	if (!canManageCourse(access, session.user.role)) return null
	return session
}

async function getRoster(courseId: string) {
	const course = await supabaseDb.query.courses.findFirst({
		where: eq(courses.id, courseId),
		with: {
			enrollments: {
				with: { student: true },
			},
			memberships: {
				with: { user: true },
			},
		},
	})
	if (!course) return null

	const membershipByUserId = new Map(
		course.memberships.map((membership) => [membership.userId, membership.role])
	)

	const roster = course.enrollments.map((enrollment) => ({
		userId: enrollment.studentId,
		name: enrollment.student.name,
		email: enrollment.student.email,
		image: enrollment.student.image,
		role: membershipByUserId.get(enrollment.studentId) ?? 'student',
		enrolledAt: enrollment.enrolledAt,
	}))

	for (const membership of course.memberships) {
		if (roster.some((entry) => entry.userId === membership.userId)) continue
		roster.push({
			userId: membership.userId,
			name: membership.user?.name ?? null,
			email: membership.user?.email ?? null,
			image: membership.user?.image ?? null,
			role: membership.role,
			enrolledAt: membership.joinedAt,
		})
	}

	return roster
}

export async function GET(
	_req: Request,
	context: { params: Promise<{ id: string }> }
) {
	const { id: courseId } = await context.params
	const session = await authorize(courseId)
	if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

	const roster = await getRoster(courseId)
	if (!roster) return NextResponse.json({ error: 'Not found' }, { status: 404 })

	return NextResponse.json({ roster })
}

export async function PUT(
	req: Request,
	context: { params: Promise<{ id: string }> }
) {
	const { id: courseId } = await context.params
	const session = await authorize(courseId)
	if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

	const body = await req.json()
	const parsed = UpdateMembershipSchema.safeParse(body)
	if (!parsed.success) {
		return NextResponse.json(parsed.error.format(), { status: 400 })
	}

	await upsertCourseMembership({
		courseId,
		userId: parsed.data.userId,
		role: parsed.data.role,
		invitedBy: session.user.id,
	})

	const roster = await getRoster(courseId)
	return NextResponse.json({ roster: roster ?? [] })
}
