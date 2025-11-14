import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { enrollStudent } from '@/db/queries/courses'

export async function POST(req: Request, context: { params: { id: string } }) {
	const session = await getServerSession(authOptions)
	if (!session) {
		return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
	}

	const courseId = context.params.id
	const studentId = session.user.id

	const result = await enrollStudent(courseId, studentId)

	return NextResponse.json(result)
}
