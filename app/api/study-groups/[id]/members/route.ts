import { NextResponse } from 'next/server'
import { and, asc, eq, inArray, not, sql } from 'drizzle-orm'
import { z } from 'zod'

import db from '@/db/drizzle'
import { studyGroupMembers, studyGroups, userProgress, users } from '@/db/schema'
import { getUserOrThrow } from '@/lib/auth'

const addMemberSchema = z.object({
	userId: z.string().trim().min(1, 'A student is required.'),
})

async function getManagedStudyGroup(studyGroupId: number) {
	return db.query.studyGroups.findFirst({
		where: eq(studyGroups.id, studyGroupId),
		columns: {
			id: true,
			teacherId: true,
		},
	})
}

async function getStudyGroupMembers(studyGroupId: number) {
	return db
		.select({
			userId: userProgress.userId,
			userName: userProgress.userName,
			email: users.email,
			userImageSrc: sql<string>`COALESCE(${users.image}, ${userProgress.userImageSrc}, '/mascot.svg')`,
		})
		.from(studyGroupMembers)
		.innerJoin(userProgress, eq(studyGroupMembers.userId, userProgress.userId))
		.leftJoin(users, eq(users.id, userProgress.userId))
		.where(eq(studyGroupMembers.studyGroupId, studyGroupId))
		.orderBy(asc(userProgress.userName))
}

async function getAvailableUsers(studyGroupId: number, teacherId: string) {
	const memberRows = await db
		.select({
			userId: studyGroupMembers.userId,
		})
		.from(studyGroupMembers)
		.where(eq(studyGroupMembers.studyGroupId, studyGroupId))

	const excludedUserIds = Array.from(
		new Set([teacherId, ...memberRows.map((row) => row.userId)])
	)

	return db
		.select({
			userId: userProgress.userId,
			userName: userProgress.userName,
			email: users.email,
			userImageSrc: sql<string>`COALESCE(${users.image}, ${userProgress.userImageSrc}, '/mascot.svg')`,
		})
		.from(userProgress)
		.leftJoin(users, eq(users.id, userProgress.userId))
		.where(not(inArray(userProgress.userId, excludedUserIds)))
		.orderBy(asc(userProgress.userName))
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

		const group = await getManagedStudyGroup(studyGroupId)
		if (!group) {
			return NextResponse.json({ error: 'Study group not found' }, { status: 404 })
		}

		if (group.teacherId !== userId) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
		}

		const [members, availableUsers] = await Promise.all([
			getStudyGroupMembers(studyGroupId),
			getAvailableUsers(studyGroupId, group.teacherId),
		])

		return NextResponse.json({ members, availableUsers })
	} catch (error) {
		if (error instanceof Error && error.message === 'Unauthorized') {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		console.error('Error fetching study group members:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch study group members' },
			{ status: 500 }
		)
	}
}

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const leaderUserId = await getUserOrThrow()
		const studyGroupId = Number((await params).id)

		if (!Number.isFinite(studyGroupId)) {
			return NextResponse.json({ error: 'Invalid study group id' }, { status: 400 })
		}

		const group = await getManagedStudyGroup(studyGroupId)
		if (!group) {
			return NextResponse.json({ error: 'Study group not found' }, { status: 404 })
		}

		if (group.teacherId !== leaderUserId) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
		}

		const body = await request.json()
		const parsed = addMemberSchema.safeParse(body)

		if (!parsed.success) {
			return NextResponse.json(
				{ error: parsed.error.issues[0]?.message || 'Invalid student.' },
				{ status: 400 }
			)
		}

		if (parsed.data.userId === group.teacherId) {
			return NextResponse.json(
				{ error: 'The study group leader is already attached to this group.' },
				{ status: 400 }
			)
		}

		const targetUser = await db.query.userProgress.findFirst({
			where: eq(userProgress.userId, parsed.data.userId),
			columns: {
				userId: true,
			},
		})

		if (!targetUser) {
			return NextResponse.json({ error: 'Student not found.' }, { status: 404 })
		}

		const existingMember = await db.query.studyGroupMembers.findFirst({
			where: and(
				eq(studyGroupMembers.studyGroupId, studyGroupId),
				eq(studyGroupMembers.userId, parsed.data.userId)
			),
			columns: {
				id: true,
			},
		})

		if (existingMember) {
			return NextResponse.json(
				{ error: 'That student is already in this study group.' },
				{ status: 409 }
			)
		}

		await db.insert(studyGroupMembers).values({
			studyGroupId,
			userId: parsed.data.userId,
		})

		const [members, availableUsers] = await Promise.all([
			getStudyGroupMembers(studyGroupId),
			getAvailableUsers(studyGroupId, group.teacherId),
		])

		return NextResponse.json({ members, availableUsers }, { status: 201 })
	} catch (error) {
		if (error instanceof Error && error.message === 'Unauthorized') {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		console.error('Error adding study group member:', error)
		return NextResponse.json(
			{ error: 'Failed to add study group member' },
			{ status: 500 }
		)
	}
}
