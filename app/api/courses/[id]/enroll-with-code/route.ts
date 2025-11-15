// app/api/courses/[id]/enroll-with-code/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { enrollStudent, getCourseById } from '@/db/queries/courses'

export async function POST(
	req: Request,
	context: { params: Promise<{ id: string }> }
) {
	const session = await getServerSession(authOptions)
	if (!session)
		return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

	const { id: courseId } = await context.params
	const { code } = await req.json()

	const course = await getCourseById(courseId)

	if (!course || course.public) {
		return NextResponse.json(
			{ error: 'Invalid private course' },
			{ status: 400 }
		)
	}

	if (course.courseCode !== code.toUpperCase()) {
		return NextResponse.json({ error: 'Invalid code' }, { status: 403 })
	}

	await enrollStudent(courseId, session.user.id)

	return NextResponse.json({ success: true })
}
