// db/queries/units.ts
import { units, lessons } from '@/db/schema'
import { eq, InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { supabaseDb } from '../client'

export type InsertUnit = InferInsertModel<typeof units>
export type InsertLesson = InferInsertModel<typeof lessons>

export type Unit = InferSelectModel<typeof units>
export type Lesson = InferSelectModel<typeof lessons>

export type UnitWithLessons = Unit & {
	lessons: Lesson[]
}

export async function getUnitsForCourse(
	courseId: string
): Promise<UnitWithLessons[]> {
	return await supabaseDb.query.units.findMany({
		where: eq(units.courseId, courseId),
		with: {
			lessons: true,
		},
		orderBy: (u, { asc }) => [asc(u.order)],
	})
}

export async function insertUnitsWithLessons(
	tx: any,
	courseId: string,
	unitsData: {
		slug: string
		description?: string | null
		lessons: { slug: string; lessonNumber: string; description: string }[]
	}[]
) {
	for (let unitIndex = 0; unitIndex < unitsData.length; unitIndex++) {
		const u = unitsData[unitIndex]

		const [unitRecord] = await tx
			.insert(units)
			.values({
				courseId,
				slug: u.slug,
				description: u.description ?? null,
				order: unitIndex,
			})
			.returning()

		for (let lessonIndex = 0; lessonIndex < u.lessons.length; lessonIndex++) {
			const l = u.lessons[lessonIndex]
			await tx.insert(lessons).values({
				unitId: unitRecord.id,
				slug: l.slug,
				lessonNumber: l.lessonNumber,
				description: l.description,
				order: lessonIndex,
			})
		}
	}
}

export async function updateUnitsAndLessons(
	tx: any,
	courseId: string,
	existingUnits: any[],
	incomingUnits: any[]
) {
	// ===== UNIT DIFF =====
	const incomingIds = new Set(incomingUnits.map((u) => u.id).filter(Boolean))

	// delete removed units
	for (const u of existingUnits) {
		if (!incomingIds.has(u.id)) {
			await tx.delete(units).where(eq(units.id, u.id))
		}
	}

	// upsert units
	for (let index = 0; index < incomingUnits.length; index++) {
		const u = incomingUnits[index]

		if (u.id) {
			// update existing unit
			await tx
				.update(units)
				.set({
					slug: u.slug,
					description: u.description ?? null,
					order: index,
				})
				.where(eq(units.id, u.id))
		} else {
			// insert new unit
			const [newUnit] = await tx
				.insert(units)
				.values({
					courseId,
					slug: u.slug,
					description: u.description ?? null,
					order: index,
				})
				.returning()

			u.id = newUnit.id
		}

		// ===== LESSON DIFF =====
		await syncLessons(tx, u.id, u.lessons)
	}
}

async function syncLessons(tx: any, unitId: string, incomingLessons: any[]) {
	const existingLessons = await tx.query.lessons.findMany({
		where: eq(lessons.unitId, unitId),
	})

	const incomingIds = new Set(incomingLessons.map((l) => l.id).filter(Boolean))

	// delete removed
	for (const l of existingLessons) {
		if (!incomingIds.has(l.id)) {
			await tx.delete(lessons).where(eq(lessons.id, l.id))
		}
	}

	// upsert lessons
	for (let index = 0; index < incomingLessons.length; index++) {
		const l = incomingLessons[index]

		if (l.id) {
			await tx
				.update(lessons)
				.set({
					slug: l.slug,
					lessonNumber: l.lessonNumber,
					description: l.description,
					order: index,
				})
				.where(eq(lessons.id, l.id))
		} else {
			const [newLesson] = await tx
				.insert(lessons)
				.values({
					unitId,
					slug: l.slug,
					lessonNumber: l.lessonNumber,
					description: l.description,
					order: index,
				})
				.returning()

			l.id = newLesson.id
		}
	}
}
