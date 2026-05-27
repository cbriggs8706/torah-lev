import { NextResponse } from 'next/server'
import { and, asc, desc, eq } from 'drizzle-orm'
import { z } from 'zod'

import db from '@/db/drizzle'
import {
	curriculum,
	lessons,
	studyGroupCourse,
	studyGroupSchedule,
	studyGroupScheduleLessons,
	studyGroups,
	units,
} from '@/db/schema'
import { getUserOrThrow } from '@/lib/auth'
import {
	parseStudyGroupScheduleMeta,
	serializeStudyGroupScheduleMeta,
} from '@/lib/study-group-schedule-meta'

const createScheduleSchema = z
	.object({
		classDate: z.string().trim().min(1, 'Class date is required.'),
		studyGroupCourseId: z.number().int().positive().nullable(),
		sessionType: z.enum(['lesson', 'custom']),
		platformCourseId: z.number().int().positive().nullable(),
		title: z.string().trim().max(160).optional(),
		lessonId: z.number().int().positive().nullable(),
		notes: z.string().trim().max(1000).optional(),
	})
	.superRefine((value, ctx) => {
		if (!value.studyGroupCourseId) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'A group course is required.',
				path: ['studyGroupCourseId'],
			})
		}

		if (value.sessionType === 'lesson' && !value.lessonId) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'A lesson is required for lesson-based sessions.',
				path: ['lessonId'],
			})
		}

		if (value.sessionType === 'lesson' && !value.platformCourseId) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'A source course is required for lesson-based sessions.',
				path: ['platformCourseId'],
			})
		}

		if (value.sessionType === 'custom' && !value.title?.trim()) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'A class name is required for custom sessions.',
				path: ['title'],
			})
		}
	})

async function getStudyGroupAccess(studyGroupId: number, userId: string) {
	const group = await db.query.studyGroups.findFirst({
		where: eq(studyGroups.id, studyGroupId),
		with: {
			members: true,
		},
	})

	if (!group) return { group: null, canAccess: false, canManage: false }

	const canAccess =
		group.teacherId === userId ||
		group.members.some((member) => member.userId === userId)

	return {
		group,
		canAccess,
		canManage: group.teacherId === userId,
	}
}

async function getScheduleEvents(studyGroupId: number) {
	const rows = await db
		.select({
			id: studyGroupSchedule.id,
			classDate: studyGroupSchedule.classDate,
			notes: studyGroupSchedule.notes,
			platformCourseId: units.courseId,
			platformCourseTitle: curriculum.title,
			lessonId: lessons.id,
			lessonTitle: lessons.title,
			lessonNumber: lessons.lessonNumber,
		})
		.from(studyGroupSchedule)
		.leftJoin(
			studyGroupScheduleLessons,
			eq(studyGroupSchedule.id, studyGroupScheduleLessons.scheduleId)
		)
		.leftJoin(lessons, eq(studyGroupScheduleLessons.lessonId, lessons.id))
		.leftJoin(units, eq(lessons.unitId, units.id))
		.leftJoin(curriculum, eq(units.courseId, curriculum.id))
		.where(eq(studyGroupSchedule.studyGroupId, studyGroupId))
		.orderBy(desc(studyGroupSchedule.classDate), asc(studyGroupSchedule.id))

	return rows.map((row) => {
		const { meta, userNotes } = parseStudyGroupScheduleMeta(row.notes)

		return {
			id: row.id,
			classDate: row.classDate,
			title: meta?.title ?? null,
			notes: userNotes,
			studyGroupCourseId: meta?.studyGroupCourseId ?? null,
			groupCourseName: meta?.groupCourseName ?? null,
			platformCourseId: row.platformCourseId ?? meta?.platformCourseId ?? null,
			platformCourseTitle: row.platformCourseTitle,
			lessonId: row.lessonId,
			lessonTitle: row.lessonTitle,
			lessonNumber: row.lessonNumber,
		}
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

		const access = await getStudyGroupAccess(studyGroupId, userId)

		if (!access.group) {
			return NextResponse.json({ error: 'Study group not found' }, { status: 404 })
		}

		if (!access.canAccess) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
		}

		const events = await getScheduleEvents(studyGroupId)
		return NextResponse.json({ events })
	} catch (error) {
		if (error instanceof Error && error.message === 'Unauthorized') {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		console.error('Error fetching study group schedule:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch study group schedule' },
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

		const access = await getStudyGroupAccess(studyGroupId, userId)

		if (!access.group) {
			return NextResponse.json({ error: 'Study group not found' }, { status: 404 })
		}

		if (!access.canManage) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
		}

		const body = await request.json()
		const parsed = createScheduleSchema.safeParse({
			classDate: body.classDate,
			studyGroupCourseId:
				typeof body.studyGroupCourseId === 'number'
					? body.studyGroupCourseId
					: null,
			sessionType: body.sessionType,
			platformCourseId:
				typeof body.platformCourseId === 'number'
					? body.platformCourseId
					: null,
			title: typeof body.title === 'string' ? body.title : undefined,
			lessonId: typeof body.lessonId === 'number' ? body.lessonId : null,
			notes: typeof body.notes === 'string' ? body.notes : undefined,
		})

		if (!parsed.success) {
			return NextResponse.json(
				{ error: parsed.error.issues[0]?.message || 'Invalid schedule event' },
				{ status: 400 }
			)
		}

		const classDate = new Date(parsed.data.classDate)

		if (Number.isNaN(classDate.getTime())) {
			return NextResponse.json(
				{ error: 'Class date must be a valid date and time.' },
				{ status: 400 }
			)
		}

		const [selectedGroupCourse] = await db
			.select({
				id: studyGroupCourse.id,
				studyGroupId: studyGroupCourse.studyGroupId,
				name: studyGroupCourse.name,
			})
			.from(studyGroupCourse)
			.where(
				and(
					eq(studyGroupCourse.id, parsed.data.studyGroupCourseId!),
					eq(studyGroupCourse.studyGroupId, studyGroupId)
				)
			)
			.limit(1)

		if (!selectedGroupCourse) {
			return NextResponse.json(
				{ error: 'Selected group course was not found.' },
				{ status: 404 }
			)
		}

		if (parsed.data.sessionType === 'lesson') {
			const lesson = await db
				.select({ id: lessons.id })
				.from(lessons)
				.innerJoin(units, eq(lessons.unitId, units.id))
				.where(
					and(
						eq(lessons.id, parsed.data.lessonId!),
						eq(units.courseId, parsed.data.platformCourseId!)
					)
				)
				.limit(1)

			if (!lesson.length) {
				return NextResponse.json(
					{ error: 'Selected lesson was not found.' },
					{ status: 404 }
				)
			}
		}

		const [created] = await db
			.insert(studyGroupSchedule)
			.values({
				studyGroupId,
				classDate,
				notes: serializeStudyGroupScheduleMeta({
					studyGroupCourseId: parsed.data.studyGroupCourseId,
					groupCourseName: selectedGroupCourse.name,
					title:
						parsed.data.sessionType === 'custom'
							? parsed.data.title?.trim() || null
							: null,
					userNotes: parsed.data.notes?.trim() || null,
					platformCourseId:
						parsed.data.sessionType === 'lesson'
							? parsed.data.platformCourseId
							: null,
				}),
			})
			.returning({ id: studyGroupSchedule.id })

		if (parsed.data.lessonId) {
			await db.insert(studyGroupScheduleLessons).values({
				scheduleId: created.id,
				lessonId: parsed.data.lessonId,
				order: 1,
			})
		}

		const events = await getScheduleEvents(studyGroupId)
		const createdEvent = events.find((event) => event.id === created.id)

		return NextResponse.json({ event: createdEvent }, { status: 201 })
	} catch (error) {
		if (error instanceof Error && error.message === 'Unauthorized') {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		console.error('Error creating study group schedule event:', error)
		return NextResponse.json(
			{ error: 'Failed to create study group schedule event' },
			{ status: 500 }
		)
	}
}
