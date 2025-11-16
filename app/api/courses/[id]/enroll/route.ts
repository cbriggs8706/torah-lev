// app/api/courses/[id]/enroll/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { enrollStudent } from '@/db/queries/courses'

export async function POST(
	req: Request,
	context: { params: Promise<{ id: string }> }
) {
	const session = await getServerSession(authOptions)
	if (!session) {
		return NextResponse.json(
			{ success: false, error: 'Not authenticated' },
			{ status: 401 }
		)
	}

	const { id: courseId } = await context.params
	const studentId = session.user.id

	const enrollment = await enrollStudent(courseId, studentId)

	return NextResponse.json({
		success: true,
		courseId,
		enrollment,
		message: 'Successfully enrolled!',
	})
}
