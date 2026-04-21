import { NextResponse } from 'next/server'
import { and, eq, sql } from 'drizzle-orm'
import { supabaseDb as db } from '@/db'
import {
	lessonRewardClaims,
	userLearningStats,
} from '@/db/schema/tables/learning_progress'
import {
	studyGroupMemberships,
	studyGroups,
} from '@/db/schema/tables/study_groups'
import { getSession } from '@/lib/auth'

type RewardBody = {
	studyGroupId?: string
	lessonId?: string
	heartsAwarded?: number
	pointsAwarded?: number
}

export async function POST(req: Request) {
	const session = await getSession()
	const userId = session?.user?.id

	if (!userId) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	try {
		const body = (await req.json()) as RewardBody
		const heartsAwarded = Math.max(0, Math.min(5, body.heartsAwarded ?? 0))
		const pointsAwarded = Math.max(0, body.pointsAwarded ?? 0)

		if (!body.studyGroupId || !body.lessonId) {
			return NextResponse.json(
				{ error: 'Study group and lesson are required' },
				{ status: 400 }
			)
		}

		const [studyGroup, membership] = await Promise.all([
			db.query.studyGroups.findFirst({
				where: eq(studyGroups.id, body.studyGroupId),
			}),
			db.query.studyGroupMemberships.findFirst({
				where: and(
					eq(studyGroupMemberships.studyGroupId, body.studyGroupId),
					eq(studyGroupMemberships.userId, userId)
				),
			}),
		])

		if (!studyGroup || !membership) {
			return NextResponse.json({ error: 'Not found' }, { status: 404 })
		}

		const result = await db.transaction(async (tx) => {
			const inserted = await tx
				.insert(lessonRewardClaims)
				.values({
					userId,
					studyGroupId: body.studyGroupId!,
					lessonId: body.lessonId!,
					heartsAwarded,
					pointsAwarded,
				})
				.onConflictDoNothing()
				.returning()

			if (!inserted.length) {
				const stats = await tx.query.userLearningStats.findFirst({
					where: eq(userLearningStats.userId, userId),
				})

				return {
					claimed: false,
					hearts: stats?.hearts ?? 5,
					points: stats?.points ?? 0,
				}
			}

			const [stats] = await tx
				.insert(userLearningStats)
				.values({
					userId,
					hearts: Math.min(5, heartsAwarded),
					points: pointsAwarded,
				})
				.onConflictDoUpdate({
					target: userLearningStats.userId,
					set: {
						hearts: sql`least(5, ${userLearningStats.hearts} + ${heartsAwarded})`,
						points: sql`${userLearningStats.points} + ${pointsAwarded}`,
						updatedAt: sql`now()`,
					},
				})
				.returning()

			return {
				claimed: true,
				hearts: stats.hearts,
				points: stats.points,
			}
		})

		return NextResponse.json({ success: true, ...result })
	} catch (error) {
		console.error('Failed to claim lesson reward', error)
		return NextResponse.json(
			{ error: 'Failed to claim lesson reward' },
			{ status: 400 }
		)
	}
}
