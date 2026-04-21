import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { supabaseDb as db } from '@/db'
import { courseLessons } from '@/db/schema/tables/courses'
import { lessonModuleCompletions } from '@/db/schema/tables/learning_progress'
import { lessons } from '@/db/schema/tables/lessons'
import { lessonModules } from '@/db/schema/tables/modules'
import {
	studyGroupMemberships,
	studyGroups,
} from '@/db/schema/tables/study_groups'
import { getSession } from '@/lib/auth'

type CompletionBody = {
	studyGroupId?: string
	lessonId?: string
	moduleId?: string
}

export async function POST(req: Request) {
	const session = await getSession()
	const userId = session?.user?.id

	if (!userId) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	try {
		const body = (await req.json()) as CompletionBody

		if (!body.studyGroupId || !body.lessonId || !body.moduleId) {
			return NextResponse.json(
				{ error: 'Study group, lesson, and module are required' },
				{ status: 400 }
			)
		}

		const [studyGroup, membership, lessonModule] = await Promise.all([
			db.query.studyGroups.findFirst({
				where: eq(studyGroups.id, body.studyGroupId),
			}),
			db.query.studyGroupMemberships.findFirst({
				where: and(
					eq(studyGroupMemberships.studyGroupId, body.studyGroupId),
					eq(studyGroupMemberships.userId, userId)
				),
			}),
			db.query.lessonModules.findFirst({
				where: and(
					eq(lessonModules.lessonId, body.lessonId),
					eq(lessonModules.moduleId, body.moduleId)
				),
			}),
		])

		if (!studyGroup || !membership || !lessonModule) {
			return NextResponse.json({ error: 'Not found' }, { status: 404 })
		}

		if (studyGroup.activeCourseId) {
			const lesson = await db.query.lessons.findFirst({
				where: eq(lessons.id, body.lessonId),
			})
			const courseLesson = await db.query.courseLessons.findFirst({
				where: and(
					eq(courseLessons.courseId, studyGroup.activeCourseId),
					eq(courseLessons.lessonId, body.lessonId)
				),
			})

			if (!lesson || !courseLesson) {
				return NextResponse.json({ error: 'Not found' }, { status: 404 })
			}
		}

		await db
			.insert(lessonModuleCompletions)
			.values({
				userId,
				studyGroupId: body.studyGroupId,
				lessonId: body.lessonId,
				moduleId: body.moduleId,
			})
			.onConflictDoNothing()

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Failed to record module progress', error)
		return NextResponse.json(
			{ error: 'Failed to record module progress' },
			{ status: 400 }
		)
	}
}
