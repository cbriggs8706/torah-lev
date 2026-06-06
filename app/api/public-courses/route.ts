import { NextResponse } from 'next/server'
import { asc, desc } from 'drizzle-orm'
import { z } from 'zod'

import db from '@/db/drizzle'
import {
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
})

export async function GET() {
	const courses = await db.query.publicCourse.findMany({
		orderBy: [desc(publicCourse.createdAt)],
		with: {
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
		const rawProficiencyLevel = formData.get('proficiencyLevel')
		const rawEndingProficiencyLevel = formData.get('endingProficiencyLevel')

		const parsed = publicCourseSchema.safeParse({
			name: typeof rawName === 'string' ? rawName : '',
			proficiencyLevel:
				typeof rawProficiencyLevel === 'string'
					? rawProficiencyLevel
					: undefined,
			endingProficiencyLevel:
				typeof rawEndingProficiencyLevel === 'string'
					? rawEndingProficiencyLevel
					: undefined,
		})

		if (!parsed.success) {
			return NextResponse.json(
				{ error: parsed.error.issues[0]?.message || 'Invalid public course' },
				{ status: 400 }
			)
		}

		let imageUrl = fallbackCourseImageUrl

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
				name: parsed.data.name,
				imageUrl,
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
