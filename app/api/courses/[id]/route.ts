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
import { courses, supabaseDb, units } from '@/db'
import { eq } from 'drizzle-orm'
import { updateUnitsAndLessons } from '@/db/queries/units'

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
	current: z.boolean().optional(),
	public: z.boolean().optional(),
	units: z
		.array(
			z.object({
				id: z.string().uuid().optional(),
				slug: z.string(),
				description: z.string().nullable().optional(),
				lessons: z.array(
					z.object({
						id: z.string().uuid().optional(),
						slug: z.string(),
						lessonNumber: z.string(),
						description: z.string(),
					})
				),
			})
		)
		.optional(),
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
	if (!session || session.user.role !== 'admin')
		return new NextResponse('Unauthorized', { status: 401 })

	const { id } = await context.params
	const body = await req.json()

	const parsed = UpdateCourseSchema.safeParse(body)
	if (!parsed.success)
		return NextResponse.json(parsed.error.format(), { status: 400 })

	const data = parsed.data

	console.log('🔥 COURSE UPDATE REQUEST:', JSON.stringify(data, null, 2))

	const updated = await supabaseDb.transaction(async (tx) => {
		// 1. Update the course itself
		const [course] = await tx
			.update(courses)
			.set({
				slug: data.slug,
				courseCode: data.courseCode,
				section: data.section,
				type: data.type,
				description: data.description,
				imageSrc: data.imageSrc,
				category: data.category,
				current: data.current,
				public: data.public,
				startProficiencyLevel: data.startProficiencyLevel,
				endProficiencyLevel: data.endProficiencyLevel,
				startDate: data.startDate ? new Date(data.startDate) : undefined,
				endDate: data.endDate ? new Date(data.endDate) : undefined,
				organizerGroupName: data.organizerGroupName,
				location: data.location,
				zoomLink: data.zoomLink,
				maxEnrollment: data.maxEnrollment,
				enrollmentOpen: data.enrollmentOpen,
			})
			.where(eq(courses.id, id))
			.returning()

		if (!data.units) return course // nothing to update

		// 2. Load current units + lessons
		const existingUnits = await tx.query.units.findMany({
			where: eq(units.courseId, id),
			with: { lessons: true },
		})

		// 3. Diff + update
		await updateUnitsAndLessons(tx, id, existingUnits, data.units)

		return course
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
