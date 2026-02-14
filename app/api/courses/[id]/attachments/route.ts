export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canManageCourse, getCourseAccessById } from '@/lib/courses/access'
import { uploadCourseAttachment } from '@/lib/courses/attachments'

export async function POST(
	req: Request,
	context: { params: Promise<{ id: string }> }
) {
	const session = await getServerSession(authOptions)
	if (!session?.user?.id) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const { id: courseId } = await context.params
	const access = await getCourseAccessById(courseId, session.user.id)
	if (!canManageCourse(access, session.user.role)) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const formData = await req.formData()
	const file = formData.get('file')
	if (!(file instanceof File)) {
		return NextResponse.json({ error: 'Missing file' }, { status: 400 })
	}

	const arrayBuffer = await file.arrayBuffer()
	const uploaded = await uploadCourseAttachment({
		courseId,
		fileName: file.name,
		contentType: file.type || 'application/octet-stream',
		buffer: Buffer.from(arrayBuffer),
	})

	return NextResponse.json({
		path: uploaded.path,
		url: uploaded.url,
		name: file.name,
		size: file.size,
		mimeType: file.type || 'application/octet-stream',
	})
}
