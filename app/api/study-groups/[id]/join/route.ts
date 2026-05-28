import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'

import db from '@/db/drizzle'
import { studyGroupMembers, studyGroups } from '@/db/schema'
import { getUserOrThrow } from '@/lib/auth'

export async function POST(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const userId = await getUserOrThrow()
		const studyGroupId = Number((await params).id)

		if (!Number.isFinite(studyGroupId)) {
			return NextResponse.json({ error: 'Invalid study group id' }, { status: 400 })
		}

		const group = await db.query.studyGroups.findFirst({
			where: eq(studyGroups.id, studyGroupId),
			columns: {
				id: true,
				groupType: true,
				teacherId: true,
			},
		})

		if (!group) {
			return NextResponse.json({ error: 'Study group not found' }, { status: 404 })
		}

		if (group.groupType !== 'Public') {
			return NextResponse.json(
				{ error: 'Only public study groups can be joined directly.' },
				{ status: 403 }
			)
		}

		if (group.teacherId === userId) {
			return NextResponse.json({ joined: true, alreadyMember: true })
		}

		const existing = await db.query.studyGroupMembers.findFirst({
			where: and(
				eq(studyGroupMembers.studyGroupId, studyGroupId),
				eq(studyGroupMembers.userId, userId)
			),
			columns: { id: true },
		})

		if (!existing) {
			await db.insert(studyGroupMembers).values({
				studyGroupId,
				userId,
			})
		}

		return NextResponse.json({ joined: true, alreadyMember: Boolean(existing) })
	} catch (error) {
		if (error instanceof Error && error.message === 'Unauthorized') {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		console.error('Error joining study group:', error)
		return NextResponse.json(
			{ error: 'Failed to join study group' },
			{ status: 500 }
		)
	}
}

