import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import db from '@/db/drizzle'
import { curriculum, publicCourse } from '@/db/schema'
import { uploadCourseImage } from '@/lib/course-image-storage'
import { isAdmin } from '@/lib/admin'

const bucketName =
	process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_COURSE_BUCKET?.trim() ||
	'public-course-images'

const updatePublicCourseSchema = z.object({
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
	curriculumId: z.number().int().positive().nullable().optional(),
})

function parseId(value: string) {
	const id = Number(value)
	return Number.isFinite(id) ? id : null
}

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ courseId: string }> }
) {
	const courseId = parseId((await params).courseId)

	if (!courseId) {
		return NextResponse.json({ error: 'Invalid course id' }, { status: 400 })
	}

	const course = await db.query.publicCourse.findFirst({
		where: eq(publicCourse.id, courseId),
		with: {
			curriculum: {
				columns: {
					id: true,
					title: true,
				},
			},
		},
	})

	if (!course) {
		return NextResponse.json({ error: 'Public course not found' }, { status: 404 })
	}

	return NextResponse.json({ course })
}

export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ courseId: string }> }
) {
	if (!(await isAdmin())) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	try {
		const courseId = parseId((await params).courseId)

		if (!courseId) {
			return NextResponse.json({ error: 'Invalid course id' }, { status: 400 })
		}

		const existing = await db.query.publicCourse.findFirst({
			where: eq(publicCourse.id, courseId),
		})

		if (!existing) {
			return NextResponse.json(
				{ error: 'Public course not found' },
				{ status: 404 }
			)
		}

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

		const parsed = updatePublicCourseSchema.safeParse({
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

		let imageUrl = existing.imageUrl

		if (image instanceof File) {
			imageUrl = await uploadCourseImage({
				bucketName,
				folder: `public-courses/${courseId}`,
				file: image,
			})
		}

		const [updated] = await db
			.update(publicCourse)
			.set({
				order: parsed.data.order ?? existing.order,
				name: parsed.data.name,
				description: parsed.data.description,
				imageUrl,
				curriculumId: parsed.data.curriculumId,
				proficiencyLevel: parsed.data.proficiencyLevel,
				endingProficiencyLevel: parsed.data.endingProficiencyLevel,
				updatedAt: new Date(),
			})
			.where(eq(publicCourse.id, courseId))
			.returning()

		return NextResponse.json({ course: updated })
	} catch (error) {
		console.error('Error updating public course:', error)
		return NextResponse.json(
			{ error: 'Failed to update public course' },
			{ status: 500 }
		)
	}
}
