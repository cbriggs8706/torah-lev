import { NextResponse } from 'next/server'
import { unenrollStudent } from '@/db/queries/courses'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const UnenrollSchema = z.object({
	studentId: z.string(),
})

export async function POST(
	req: Request,
	{ params }: { params: { id: string } }
) {
	const session = await getServerSession(authOptions)
	const body = await req.json()
	const parsed = UnenrollSchema.safeParse(body)

	if (!parsed.success) {
		return NextResponse.json(parsed.error.format(), { status: 400 })
	}

	const { studentId } = parsed.data

	// Allow admin OR the user themself
	if (
		!session ||
		(session.user.role !== 'admin' && session.user.id !== studentId)
	) {
		return new NextResponse('Unauthorized', { status: 401 })
	}

	const result = await unenrollStudent(params.id, studentId)
	return NextResponse.json(result)
}
