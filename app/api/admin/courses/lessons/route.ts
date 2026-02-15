import { NextRequest, NextResponse } from 'next/server'
import { and, asc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseDb as db } from '@/db'
import { courses } from '@/db/schema/tables/courses'
import { lessons } from '@/db/schema/tables/lessons'
import { units } from '@/db/schema/tables/units'
import { parseLessonNumber } from '@/lib/lessons/lessonNumber'
import { buildLessonSlug } from '@/lib/lessons/slug'

const CreateLessonSchema = z.object({
	courseId: z.string().uuid(),
	unitId: z.string().uuid().optional(),
	title: z.string().min(1),
	lessonNumber: z.string().min(1),
	description: z.string().optional().or(z.literal('')),
	primaryType: z.enum(['youtube', 'other']),
	youtubeUrl: z.string().url().optional().or(z.literal('')),
})

export async function POST(req: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		const role = session?.user?.role ?? 'guest'
		if (!session || !['admin', 'teacher'].includes(role)) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const parsed = CreateLessonSchema.safeParse(await req.json())
		if (!parsed.success) {
			return NextResponse.json(
				{ error: 'Invalid payload', details: parsed.error.flatten() },
				{ status: 400 },
			)
		}

		const { courseId, title, lessonNumber, description, primaryType } = parsed.data
		const youtubeUrl = (parsed.data.youtubeUrl || '').trim()
		const { lessonGroupNumber, lessonVariant } = parseLessonNumber(lessonNumber)
		const slug = buildLessonSlug(title, lessonNumber)

		const [course] = await db
			.select({ id: courses.id, slug: courses.slug })
			.from(courses)
			.where(eq(courses.id, courseId))
			.limit(1)

		if (!course) {
			return NextResponse.json({ error: 'Course not found' }, { status: 404 })
		}

		const unitId = await db.transaction(async (tx) => {
			if (parsed.data.unitId) {
				const [requestedUnit] = await tx
					.select({ id: units.id })
					.from(units)
					.where(
						and(eq(units.id, parsed.data.unitId as string), eq(units.courseId, courseId)),
					)
					.limit(1)
				if (!requestedUnit) {
					throw new Error('Selected unit does not belong to the selected course')
				}
				return requestedUnit.id
			}

			const [firstUnit] = await tx
				.select({ id: units.id })
				.from(units)
				.where(eq(units.courseId, courseId))
				.orderBy(asc(units.order), asc(units.createdAt))
				.limit(1)

			if (firstUnit) return firstUnit.id

			const [orderRow] = await tx
				.select({
					nextOrder: sql<number>`coalesce(max(${units.order}), -1) + 1`,
				})
				.from(units)
				.where(eq(units.courseId, courseId))

			const [newUnit] = await tx
				.insert(units)
				.values({
					courseId,
					slug: `${course.slug}-unit-1`,
					order: orderRow?.nextOrder ?? 0,
					description: 'Auto-created default unit',
				})
				.returning({ id: units.id })

			return newUnit.id
		})

		const [created] = await db
			.insert(lessons)
			.values({
				unitId,
				slug,
				title,
				lessonNumber,
				lessonGroupNumber,
				lessonVariant,
				description: description ?? '',
				primaryType,
				youtubeUrl: primaryType === 'youtube' ? youtubeUrl || null : null,
				video: primaryType === 'youtube' ? youtubeUrl || null : null,
			})
			.returning({
				id: lessons.id,
				unitId: lessons.unitId,
				slug: lessons.slug,
				lessonNumber: lessons.lessonNumber,
			})

		return NextResponse.json({ lesson: created }, { status: 201 })
	} catch (err) {
		console.error('Failed to create admin lesson', err)
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : 'Unknown error' },
			{ status: 500 },
		)
	}
}
