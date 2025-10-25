'use server'

import db from '@/db/drizzle'
import { studyGroupSchedule, studyGroupScheduleLessons } from '@/db/schema'
import { eq } from 'drizzle-orm'

// Create or update a schedule session
export async function saveStudyGroupSession({
	studyGroupId,
	classDate,
	notes,
	homeworkInstructions,
	homeworkLinks,
	lessons,
	sessionId,
}: {
	studyGroupId: number
	classDate: string
	notes: string
	homeworkInstructions: string
	homeworkLinks: string[]
	lessons: number[]
	sessionId?: number | null
}) {
	if (sessionId) {
		// Update existing
		await db
			.update(studyGroupSchedule)
			.set({
				classDate: new Date(classDate),
				notes,
				homeworkInstructions,
				homeworkLinks,
			})
			.where(eq(studyGroupSchedule.id, sessionId))

		// Reset lessons
		await db
			.delete(studyGroupScheduleLessons)
			.where(eq(studyGroupScheduleLessons.scheduleId, sessionId))
		if (lessons.length) {
			await db.insert(studyGroupScheduleLessons).values(
				lessons.map((lessonId) => ({
					scheduleId: sessionId,
					lessonId,
				}))
			)
		}
	} else {
		// Insert new
		const [session] = await db
			.insert(studyGroupSchedule)
			.values({
				studyGroupId,
				classDate: new Date(classDate),
				notes,
				homeworkInstructions,
				homeworkLinks,
			})
			.returning({ id: studyGroupSchedule.id })

		if (lessons.length) {
			await db.insert(studyGroupScheduleLessons).values(
				lessons.map((lessonId) => ({
					scheduleId: session.id,
					lessonId,
				}))
			)
		}
	}

	return { success: true }
}
