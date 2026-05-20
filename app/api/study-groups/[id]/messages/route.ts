import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'

import db from '@/db/drizzle'
import { messages, studyGroups } from '@/db/schema'
import { getUserOrThrow } from '@/lib/auth'

async function canAccessStudyGroup(studyGroupId: number, userId: string) {
	const group = await db.query.studyGroups.findFirst({
		where: eq(studyGroups.id, studyGroupId),
		with: {
			members: true,
		},
	})

	if (!group) return false

	if (group.teacherId === userId) return true

	return group.members.some((member) => member.userId === userId)
}

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const userId = await getUserOrThrow()
		const studyGroupId = Number((await params).id)

		if (!Number.isFinite(studyGroupId)) {
			return NextResponse.json({ error: 'Invalid study group id' }, { status: 400 })
		}

		const allowed = await canAccessStudyGroup(studyGroupId, userId)
		if (!allowed) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
		}

		const rows = await db.query.messages.findMany({
			where: eq(messages.studyGroupId, studyGroupId),
			orderBy: (table, helpers) => [helpers.asc(table.createdAt)],
		})

		return NextResponse.json(
			rows.map((message) => ({
				id: message.id,
				senderId: message.senderId,
				content: message.content,
				createdAt: message.createdAt,
			}))
		)
	} catch (error) {
		if (error instanceof Error && error.message === 'Unauthorized') {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		console.error('Error fetching study group messages:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch messages' },
			{ status: 500 }
		)
	}
}

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const userId = await getUserOrThrow()
		const studyGroupId = Number((await params).id)

		if (!Number.isFinite(studyGroupId)) {
			return NextResponse.json({ error: 'Invalid study group id' }, { status: 400 })
		}

		const allowed = await canAccessStudyGroup(studyGroupId, userId)
		if (!allowed) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
		}

		const body = await request.json()
		const content =
			typeof body?.content === 'string' ? body.content.trim() : ''

		if (!content) {
			return NextResponse.json({ error: 'Message is required' }, { status: 400 })
		}

		const [created] = await db
			.insert(messages)
			.values({
				senderId: userId,
				studyGroupId,
				content,
			})
			.returning()

		return NextResponse.json(
			{
				id: created.id,
				senderId: created.senderId,
				content: created.content,
				createdAt: created.createdAt,
			},
			{ status: 201 }
		)
	} catch (error) {
		if (error instanceof Error && error.message === 'Unauthorized') {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		console.error('Error creating study group message:', error)
		return NextResponse.json(
			{ error: 'Failed to send message' },
			{ status: 500 }
		)
	}
}
