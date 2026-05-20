import path from 'node:path'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

import db from '@/db/drizzle'
import { studyGroupCourse, studyGroups } from '@/db/schema'
import { getUserOrThrow } from '@/lib/auth'

const bucketName =
	process.env.NEXT_PUBLIC_SUPABASE_STUDY_GROUP_COURSE_BUCKET?.trim() ||
	'study-group-course-images'
const fallbackCourseImageUrl = '/mascot.svg'

const updateStudyGroupCourseSchema = z.object({
	name: z.string().trim().min(1, 'Course name is required.').max(120),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
})

function sanitizeFileName(fileName: string) {
	const ext = path.extname(fileName)
	const base = path.basename(fileName, ext)
	const normalizedBase = base
		.toLowerCase()
		.replace(/[^\w.-]+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '')
	const normalizedExt = ext.toLowerCase().replace(/[^\w.]+/g, '')

	return `${normalizedBase || 'course-image'}${normalizedExt || ''}`
}

function parseDateInput(value?: string) {
	if (!value?.trim()) return null

	const parsed = new Date(`${value}T00:00:00`)
	return Number.isNaN(parsed.getTime()) ? null : parsed
}

async function ensureBucket(supabase: ReturnType<typeof createClient>) {
	const { data: buckets, error: listError } = await supabase.storage.listBuckets()
	if (listError) throw listError

	if (buckets.some((bucket) => bucket.name === bucketName)) return

	const { error: createError } = await supabase.storage.createBucket(bucketName, {
		public: true,
	})

	if (createError && !/already exists/i.test(createError.message)) {
		throw createError
	}
}

async function getManagedStudyGroup(studyGroupId: number) {
	return db.query.studyGroups.findFirst({
		where: eq(studyGroups.id, studyGroupId),
		columns: {
			id: true,
			teacherId: true,
		},
	})
}

export async function PUT(
	request: Request,
	{
		params,
	}: {
		params: Promise<{ id: string; courseId: string }>
	}
) {
	try {
		const userId = await getUserOrThrow()
		const { id, courseId } = await params
		const studyGroupId = Number(id)
		const parsedCourseId = Number(courseId)

		if (!Number.isFinite(studyGroupId) || !Number.isFinite(parsedCourseId)) {
			return NextResponse.json({ error: 'Invalid course id' }, { status: 400 })
		}

		const group = await getManagedStudyGroup(studyGroupId)
		if (!group) {
			return NextResponse.json({ error: 'Study group not found' }, { status: 404 })
		}

		if (group.teacherId !== userId) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
		}

		const existingCourse = await db.query.studyGroupCourse.findFirst({
			where: and(
				eq(studyGroupCourse.id, parsedCourseId),
				eq(studyGroupCourse.studyGroupId, studyGroupId)
			),
		})

		if (!existingCourse) {
			return NextResponse.json({ error: 'Course not found' }, { status: 404 })
		}

		const formData = await request.formData()
		const image = formData.get('image')
		const rawName = formData.get('name')
		const rawStartDate = formData.get('startDate')
		const rawEndDate = formData.get('endDate')

		const parsed = updateStudyGroupCourseSchema.safeParse({
			name: typeof rawName === 'string' ? rawName : '',
			startDate: typeof rawStartDate === 'string' ? rawStartDate : undefined,
			endDate: typeof rawEndDate === 'string' ? rawEndDate : undefined,
		})

		if (!parsed.success) {
			return NextResponse.json(
				{ error: parsed.error.issues[0]?.message || 'Invalid course name' },
				{ status: 400 }
			)
		}

		const startDate = parseDateInput(parsed.data.startDate)
		const endDate = parseDateInput(parsed.data.endDate)

		if (
			startDate &&
			endDate &&
			startDate.getTime() > endDate.getTime()
		) {
			return NextResponse.json(
				{ error: 'End date must be on or after the start date.' },
				{ status: 400 }
			)
		}

		let imageUrl = existingCourse.imageUrl || fallbackCourseImageUrl

		if (image instanceof File) {
			const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
			const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

			if (!supabaseUrl || !serviceRoleKey) {
				return NextResponse.json(
					{ error: 'Supabase storage env vars are missing.' },
					{ status: 500 }
				)
			}

			const supabase = createClient(supabaseUrl, serviceRoleKey)
			await ensureBucket(supabase)

			const storagePath = `study-group-${studyGroupId}/${Date.now()}-${sanitizeFileName(
				image.name
			)}`

			const { error: uploadError } = await supabase.storage
				.from(bucketName)
				.upload(storagePath, image, { upsert: true })

			if (uploadError) {
				return NextResponse.json({ error: uploadError.message }, { status: 500 })
			}

			const { data: publicUrl } = supabase.storage
				.from(bucketName)
				.getPublicUrl(storagePath)

			imageUrl = publicUrl.publicUrl
		}

		const [updated] = await db
			.update(studyGroupCourse)
			.set({
				name: parsed.data.name,
				imageUrl,
				startDate,
				endDate,
				updatedAt: new Date(),
			})
			.where(
				and(
					eq(studyGroupCourse.id, parsedCourseId),
					eq(studyGroupCourse.studyGroupId, studyGroupId)
				)
			)
			.returning({
				id: studyGroupCourse.id,
				name: studyGroupCourse.name,
				imageUrl: studyGroupCourse.imageUrl,
				startDate: studyGroupCourse.startDate,
				endDate: studyGroupCourse.endDate,
				createdAt: studyGroupCourse.createdAt,
			})

		return NextResponse.json({ course: updated })
	} catch (error) {
		if (error instanceof Error && error.message === 'Unauthorized') {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		console.error('Error updating study group course:', error)
		return NextResponse.json(
			{ error: 'Failed to update study group course' },
			{ status: 500 }
		)
	}
}
