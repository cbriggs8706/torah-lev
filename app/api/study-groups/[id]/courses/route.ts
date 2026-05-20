import path from 'node:path'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import db from '@/db/drizzle'
import { studyGroupCourse, studyGroups } from '@/db/schema'
import { getUserOrThrow } from '@/lib/auth'

const bucketName =
	process.env.NEXT_PUBLIC_SUPABASE_STUDY_GROUP_COURSE_BUCKET?.trim() ||
	'study-group-course-images'
const fallbackCourseImageUrl = '/mascot.svg'

const createStudyGroupCourseSchema = z.object({
	name: z.string().trim().min(1, 'Course name is required.').max(120),
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

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const userId = await getUserOrThrow()
		const studyGroupId = Number((await params).id)

		if (!Number.isFinite(studyGroupId)) {
			return NextResponse.json({ error: 'Invalid study group id' }, { status: 400 })
		}

		const group = await db.query.studyGroups.findFirst({
			where: eq(studyGroups.id, studyGroupId),
			with: {
				members: true,
			},
		})

		if (!group) {
			return NextResponse.json({ error: 'Study group not found' }, { status: 404 })
		}

		const canAccess =
			group.teacherId === userId ||
			group.members.some((member) => member.userId === userId)

		if (!canAccess) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
		}

		const courses = await db.query.studyGroupCourse.findMany({
			where: eq(studyGroupCourse.studyGroupId, studyGroupId),
			orderBy: (table, helpers) => [helpers.desc(table.createdAt)],
		})

		return NextResponse.json({ courses })
	} catch (error) {
		if (error instanceof Error && error.message === 'Unauthorized') {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		console.error('Error fetching study group courses:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch study group courses' },
			{ status: 500 }
		)
	}
}

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const userId = await getUserOrThrow()
		const studyGroupId = Number((await params).id)

		if (!Number.isFinite(studyGroupId)) {
			return NextResponse.json({ error: 'Invalid study group id' }, { status: 400 })
		}

		const group = await getManagedStudyGroup(studyGroupId)
		if (!group) {
			return NextResponse.json({ error: 'Study group not found' }, { status: 404 })
		}

		if (group.teacherId !== userId) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
		}

		const formData = await request.formData()
		const image = formData.get('image')
		const rawName = formData.get('name')

		const parsed = createStudyGroupCourseSchema.safeParse({
			name: typeof rawName === 'string' ? rawName : '',
		})

		if (!parsed.success) {
			return NextResponse.json(
				{ error: parsed.error.issues[0]?.message || 'Invalid course name' },
				{ status: 400 }
			)
		}

		let imageUrl = fallbackCourseImageUrl

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

		const [created] = await db
			.insert(studyGroupCourse)
			.values({
				studyGroupId,
				name: parsed.data.name,
				imageUrl,
			})
			.returning({
				id: studyGroupCourse.id,
				name: studyGroupCourse.name,
				imageUrl: studyGroupCourse.imageUrl,
				createdAt: studyGroupCourse.createdAt,
			})

		return NextResponse.json({ course: created }, { status: 201 })
	} catch (error) {
		if (error instanceof Error && error.message === 'Unauthorized') {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		console.error('Error creating study group course:', error)
		return NextResponse.json(
			{ error: 'Failed to create study group course' },
			{ status: 500 }
		)
	}
}
