import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { supabaseDb as db } from '@/db'
import {
	studyGroupMemberships,
	studyGroups,
} from '@/db/schema/tables/study_groups'
import { getSession } from '@/lib/auth'

export async function POST(req: Request) {
	const session = await getSession()
	const userId = session?.user?.id

	if (!userId) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	try {
		const body = (await req.json()) as { studyGroupId?: string }
		if (!body.studyGroupId) {
			return NextResponse.json(
				{ error: 'Study group is required' },
				{ status: 400 }
			)
		}

		const studyGroup = await db.query.studyGroups.findFirst({
			where: eq(studyGroups.id, body.studyGroupId),
		})

		if (!studyGroup) {
			return NextResponse.json(
				{ error: 'Study group not found' },
				{ status: 404 }
			)
		}

		await db
			.insert(studyGroupMemberships)
			.values({
				studyGroupId: body.studyGroupId,
				userId,
				role: 'student',
			})
			.onConflictDoNothing()

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Failed to join study group', error)
		return NextResponse.json(
			{ error: 'Failed to join study group' },
			{ status: 400 }
		)
	}
}
