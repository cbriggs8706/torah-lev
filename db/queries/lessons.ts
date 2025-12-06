// db/queries/lessons.ts
import { supabaseDb as db } from '@/db/client'
import { lessons } from '@/db/schema/tables/lessons'
import { eq } from 'drizzle-orm'

export async function getLessonById(id: string) {
	return db.query.lessons.findFirst({
		where: eq(lessons.id, id),
		with: {
			unit: true,
		},
	})
}

export async function getLessonsByUnit(unitId: string) {
	return db.query.lessons.findMany({
		where: eq(lessons.unitId, unitId),
	})
}

export async function createLesson(data: {
	lesson: Omit<typeof lessons.$inferInsert, 'id'>
}) {
	const [inserted] = await db.insert(lessons).values(data.lesson).returning()

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
}
