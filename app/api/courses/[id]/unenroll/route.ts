// app/api/courses/[id]/unenroll/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse } from 'next/server'
import { unenrollStudent } from '@/db/queries/courses'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request, context: { params: { id: string } }) {
	const session = await getServerSession(authOptions)
	if (!session) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	// const { id: courseId } = await context.params
	const courseId = context.params.id
	const studentId = session.user.id

	const result = await unenrollStudent(courseId, studentId)
	return NextResponse.json(result)
}
