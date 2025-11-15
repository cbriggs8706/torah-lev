// app/api/admin/courses/route.ts
import { NextResponse } from 'next/server'
import { supabaseDb } from '@/db/client'
import { getUserRole } from '@/lib/auth'
import { courses } from '@/db/schema/tables/courses'
import { courseTranslations } from '@/db/schema/tables/course_translations'
import { units } from '@/db/schema/tables/units'
import { unitTranslations } from '@/db/schema/tables/unit_translations'
import { lessons } from '@/db/schema/tables/lessons'
import { lessonTranslations } from '@/db/schema/tables/lesson_translations'
import type { CreateCourseInput } from '@/types/adminCourse'

export async function POST(req: Request) {
	try {
		const role = await getUserRole()
		if (role !== 'admin') {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
		}

		const body: CreateCourseInput = await req.json()
		const { slug, imageSrc, category, translations, units: unitData } = body

		if (!slug || !imageSrc) {
			return NextResponse.json(
				{ error: 'Missing required fields' },
				{ status: 400 }
			)
		}

		const result = await supabaseDb.transaction(async (tx) => {
			// 1️⃣ Course
			const [newCourse] = await tx
				.insert(courses)
				.values({
					slug,
					imageSrc,
					category,
					public: true,
					//TODO revist these, I don't think they're how I want them
					courseCode: slug.toUpperCase(),
					type: 'INPERSON',
					startProficiencyLevel: 'A1',
					endProficiencyLevel: 'A1',

					// OPTIONAL nullable fields
					description: null,
					location: null,
					zoomLink: null,
					maxEnrollment: null,
				})
				.returning({ id: courses.id })

			const courseId = newCourse.id

			// 2️⃣ Course Translations
			if (translations?.length) {
				await tx.insert(courseTranslations).values(
					translations.map((t) => ({
						courseId,
						locale: t.locale,
						title: t.title,
						description: t.description,
					}))
				)
			}

			// 3️⃣ Units + Lessons
			for (const [uIndex, unit] of (unitData ?? []).entries()) {
				const [newUnit] = await tx
					.insert(units)
					.values({
						courseId,
						slug: `${slug}-unit-${uIndex + 1}`,
						order: uIndex + 1,
					})
					.returning({ id: units.id })

				const unitId = newUnit.id

				if (unit.title) {
					await tx.insert(unitTranslations).values({
						unitId,
						locale: unit.locale ?? 'en',
						title: unit.title,
					})
				}

				for (const [lIndex, lesson] of (unit.lessons ?? []).entries()) {
					const [newLesson] = await tx
						.insert(lessons)
						.values({
							unitId,
							slug: `${slug}-u${uIndex + 1}-lesson-${lIndex + 1}`,
							order: lIndex + 1,
						})
						.returning({ id: lessons.id })

					const lessonId = newLesson.id

					if (lesson.title) {
						await tx.insert(lessonTranslations).values({
							lessonId,
							locale: lesson.locale ?? 'en',
							title: lesson.title,
						})
					}
				}
			}

			return courseId
		})

		return NextResponse.json({ success: true, courseId: result })
	} catch (err) {
		console.error('Error creating course:', err)
		if (err instanceof Error) {
			return NextResponse.json(
				{ error: 'Failed to create course', details: err.message },
				{ status: 500 }
			)
		}
		return NextResponse.json({ error: 'Unknown error' }, { status: 500 })
	}
}
