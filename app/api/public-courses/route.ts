import { NextResponse } from 'next/server'
import { asc, eq, max } from 'drizzle-orm'
import { z } from 'zod'

import db from '@/db/drizzle'
import {
	curriculum,
	publicCourse,
	publicCourseLesson,
	publicCourseLessonActivity,
} from '@/db/schema'
import {
	fallbackCourseImageUrl,
	uploadCourseImage,
} from '@/lib/course-image-storage'
import { isAdmin } from '@/lib/admin'

const bucketName =
	process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_COURSE_BUCKET?.trim() ||
	'public-course-images'

const publicCourseSchema = z.object({
	name: z.string().trim().min(1, 'Course name is required.').max(120),
	description: z
		.string()
		.trim()
		.max(240)
		.optional()
		.transform((value) => value || null),
	order: z.number().int().positive().optional(),
	proficiencyLevel: z
		.string()
		.trim()
		.optional()
		.transform((value) => value || null),
	endingProficiencyLevel: z
		.string()
		.trim()
		.optional()
		.transform((value) => value || null),
	curriculumId: z.number().int().positive(),
})

export async function GET() {
	const courses = await db.query.publicCourse.findMany({
		orderBy: [asc(publicCourse.order), asc(publicCourse.name)],
		with: {
			curriculum: {
				columns: {
					id: true,
					title: true,
				},
			},
			lessons: {
				orderBy: [asc(publicCourseLesson.order)],
				with: {
					platformCourse: {
						columns: {
							id: true,
							title: true,
						},
					},
					lesson: {
						columns: {
							id: true,
							title: true,
							lessonNumber: true,
							order: true,
						},
						with: {
							unit: {
								columns: {
									id: true,
									title: true,
									order: true,
								},
							},
							course: {
								columns: {
									id: true,
									title: true,
								},
							},
						},
					},
					activities: {
						orderBy: [asc(publicCourseLessonActivity.order)],
					},
				},
			},
		},
	})

	return NextResponse.json({ courses })
}

export async function POST(request: Request) {
	if (!(await isAdmin())) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	try {
		const formData = await request.formData()
		const image = formData.get('image')
		const rawName = formData.get('name')
		const rawDescription = formData.get('description')
		const rawOrder = formData.get('order')
		const rawProficiencyLevel = formData.get('proficiencyLevel')
		const rawEndingProficiencyLevel = formData.get('endingProficiencyLevel')
		const rawCurriculumId = formData.get('curriculumId')
		const parsedOrder =
			typeof rawOrder === 'string' && rawOrder.trim()
				? Number(rawOrder)
				: undefined
		const parsedCurriculumId =
			typeof rawCurriculumId === 'string' && rawCurriculumId.trim()
				? Number(rawCurriculumId)
				: null

		const parsed = publicCourseSchema.safeParse({
			name: typeof rawName === 'string' ? rawName : '',
			description:
				typeof rawDescription === 'string' ? rawDescription : undefined,
			order:
				Number.isFinite(parsedOrder) && parsedOrder !== undefined
					? parsedOrder
					: undefined,
			proficiencyLevel:
				typeof rawProficiencyLevel === 'string'
					? rawProficiencyLevel
					: undefined,
			endingProficiencyLevel:
				typeof rawEndingProficiencyLevel === 'string'
					? rawEndingProficiencyLevel
					: undefined,
			curriculumId:
				Number.isFinite(parsedCurriculumId) && parsedCurriculumId !== null
					? parsedCurriculumId
					: null,
		})

		if (!parsed.success) {
			return NextResponse.json(
				{ error: parsed.error.issues[0]?.message || 'Invalid public course' },
				{ status: 400 }
			)
		}

		if (parsed.data.curriculumId !== null) {
			const linkedCurriculum = await db.query.curriculum.findFirst({
				where: eq(curriculum.id, parsed.data.curriculumId),
				columns: { id: true },
			})

			if (!linkedCurriculum) {
				return NextResponse.json(
					{ error: 'Selected curriculum not found' },
					{ status: 400 }
				)
			}
		}

		const [{ maxOrder }] = await db
			.select({ maxOrder: max(publicCourse.order) })
			.from(publicCourse)

		let imageUrl = fallbackCourseImageUrl
		const order = parsed.data.order ?? (maxOrder ?? 0) + 1

		if (image instanceof File) {
			imageUrl = await uploadCourseImage({
				bucketName,
				folder: 'public-courses',
				file: image,
			})
		}

		const [created] = await db
			.insert(publicCourse)
			.values({
				order,
				name: parsed.data.name,
				description: parsed.data.description,
				imageUrl,
				curriculumId: parsed.data.curriculumId,
				proficiencyLevel: parsed.data.proficiencyLevel,
				endingProficiencyLevel: parsed.data.endingProficiencyLevel,
			})
			.returning()

		return NextResponse.json({ course: created }, { status: 201 })
	} catch (error) {
		console.error('Error creating public course:', error)
		return NextResponse.json(
			{ error: 'Failed to create public course' },
			{ status: 500 }
		)
	}
}
