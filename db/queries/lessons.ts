// db/queries/lessons.ts
import { supabaseDb as db } from '@/db/client'
import { lessons } from '@/db/schema/tables/lessons'
import { lessonHebrewVocab } from '@/db/schema/tables/lessonHebrewVocab'
import { eq } from 'drizzle-orm'

export async function getLessonById(id: string) {
	return db.query.lessons.findFirst({
		where: eq(lessons.id, id),
		with: {
			vocabConnections: true, // thanks to relations()
			unit: true,
		},
	})
}

export async function getLessonsByUnit(unitId: string) {
	return db.query.lessons.findMany({
		where: eq(lessons.unitId, unitId),
		with: {
			vocabConnections: true,
		},
	})
}

export async function createLesson(data: {
	lesson: Omit<typeof lessons.$inferInsert, 'id'>
	vocabIds?: string[]
}) {
	const [inserted] = await db.insert(lessons).values(data.lesson).returning()

	if (data.vocabIds?.length) {
		await db.insert(lessonHebrewVocab).values(
			data.vocabIds.map((vocabId) => ({
				lessonId: inserted.id,
				vocabId,
			}))
		)
	}

	return inserted
}

export async function updateLesson(
	id: string,
	data: {
		lesson: Partial<typeof lessons.$inferInsert>
		vocabIds?: string[]
	}
) {
	// await db.update(lessons).set(data.lesson).where(eq(lessons.id, id))
	const cleanedData = Object.fromEntries(
		Object.entries(data.lesson).filter(([, value]) => value !== undefined)
	)

	await db.update(lessons).set(cleanedData).where(eq(lessons.id, id))

	if (data.vocabIds) {
		// remove old
		await db.delete(lessonHebrewVocab).where(eq(lessonHebrewVocab.lessonId, id))

		// reinsert
		if (data.vocabIds.length) {
			await db.insert(lessonHebrewVocab).values(
				data.vocabIds.map((vocabId) => ({
					lessonId: id,
					vocabId,
				}))
			)
		}
	}
}
