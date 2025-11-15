// app/api/courses/[id]/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse } from 'next/server'
import { getCourse, updateCourse, deleteCourse } from '@/db/queries/courses'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import { courseType, proficiencyLevel } from '@/db/schema/enums'

type CourseType = (typeof courseType.enumValues)[number]
// type Level = (typeof proficiencyLevel.enumValues)[number]

const UpdateCourseSchema = z.object({
	slug: z.string().optional(),
	courseCode: z.string().optional(),
	section: z.string().optional(),

	type: z
		.enum(courseType.enumValues as [CourseType, ...CourseType[]])
		.optional(),

	description: z.string().optional(),
	imageSrc: z.string().optional(),
	category: z.string().optional(),

	startProficiencyLevel: z.enum(proficiencyLevel.enumValues).optional(),
	endProficiencyLevel: z.enum(proficiencyLevel.enumValues).optional(),

	startDate: z.string().optional(),
	endDate: z.string().optional(),

	organizerId: z.string().optional(),
	organizerGroupName: z.string().optional(),
	location: z.string().optional(),
	zoomLink: z.string().optional(),
	maxEnrollment: z.number().optional(),
	enrollmentOpen: z.boolean().optional(),
})

// ==============================
// GET /api/courses/[id]
// ==============================
export async function GET(
	req: Request,
	context: { params: Promise<{ id: string }> }
) {
	const { id } = await context.params
	const course = await getCourse(id)
	if (!course) return new NextResponse('Not found', { status: 404 })

	return NextResponse.json(course)
}

// ==============================
// PATCH /api/courses/[id] (ADMIN)
// ==============================
export async function PATCH(
	req: Request,
	context: { params: Promise<{ id: string }> }
) {
	const session = await getServerSession(authOptions)
	const { id } = await context.params
	if (!session || session.user.role !== 'admin') {
		return new NextResponse('Unauthorized', { status: 401 })
	}

	const body = await req.json()
	const parsed = UpdateCourseSchema.safeParse(body)

	if (!parsed.success) {
		return NextResponse.json(parsed.error.format(), { status: 400 })
	}

	const data = parsed.data

	const updated = await updateCourse(id, {
		...data,
		startDate: data.startDate ? new Date(data.startDate) : undefined,
		endDate: data.endDate ? new Date(data.endDate) : undefined,
	})

	return NextResponse.json(updated)
}

// ==============================
// DELETE /api/courses/[id] (ADMIN)
// ==============================
export async function DELETE(
	req: Request,
	context: { params: Promise<{ id: string }> }
) {
	const { id } = await context.params
	if (!id) {
		return NextResponse.json({ error: 'Missing ID' }, { status: 400 })
	}

	try {
		await deleteCourse(id)
		return NextResponse.json({ success: true })
	} catch (err) {
		console.error('Delete error:', err)
		return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
	}
}
