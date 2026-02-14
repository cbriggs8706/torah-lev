export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { and, asc, eq } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
	canAccessPrivateCourse,
	canManageCourse,
	getCourseAccessById,
} from '@/lib/courses/access'
import { supabaseDb } from '@/db/client'
import { courseThreads, threadMembers, threadMessages } from '@/db/schema/tables/course_collaboration'
import { createThreadMessage } from '@/db/queries/course-collaboration'

const CreateMessageSchema = z.object({
	contentHtml: z.string().min(1),
	contentText: z.string().optional(),
	attachments: z.array(z.unknown()).default([]),
})

async function authorize(courseId: string, threadId: string) {
	const session = await getServerSession(authOptions)
	if (!session?.user?.id) return { error: 'Unauthorized' as const }
	const access = await getCourseAccessById(courseId, session.user.id)
	if (!canAccessPrivateCourse(access, session.user.role)) {
		return { error: 'Unauthorized' as const }
	}

	const thread = await supabaseDb.query.courseThreads.findFirst({
		where: and(eq(courseThreads.id, threadId), eq(courseThreads.courseId, courseId)),
	})
	if (!thread) return { error: 'Not found' as const }

	if (!canManageCourse(access, session.user.role)) {
		const member = await supabaseDb.query.threadMembers.findFirst({
			where: and(
				eq(threadMembers.threadId, threadId),
				eq(threadMembers.userId, session.user.id)
			),
		})
		if (!member) return { error: 'Unauthorized' as const }
	}

	return { session }
}

export async function GET(
	_req: Request,
	context: { params: Promise<{ id: string; threadId: string }> }
) {
	const { id: courseId, threadId } = await context.params
	const auth = await authorize(courseId, threadId)
	if ('error' in auth) {
		const status = auth.error === 'Not found' ? 404 : 401
		return NextResponse.json({ error: auth.error }, { status })
	}

	const messages = await supabaseDb.query.threadMessages.findMany({
		where: eq(threadMessages.threadId, threadId),
		with: {
			sender: true,
		},
		orderBy: [asc(threadMessages.createdAt)],
	})

	return NextResponse.json({ messages })
}

export async function POST(
	req: Request,
	context: { params: Promise<{ id: string; threadId: string }> }
) {
	const { id: courseId, threadId } = await context.params
	const auth = await authorize(courseId, threadId)
	if ('error' in auth) {
		const status = auth.error === 'Not found' ? 404 : 401
		return NextResponse.json({ error: auth.error }, { status })
	}

	const body = await req.json()
	const parsed = CreateMessageSchema.safeParse(body)
	if (!parsed.success) {
		return NextResponse.json(parsed.error.format(), { status: 400 })
	}

	const message = await createThreadMessage({
		threadId,
		senderId: auth.session.user.id,
		contentHtml: parsed.data.contentHtml,
		contentText: parsed.data.contentText ?? null,
		attachments: parsed.data.attachments,
	})

	return NextResponse.json({ message }, { status: 201 })
}
