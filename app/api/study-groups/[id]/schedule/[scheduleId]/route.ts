import { NextResponse } from 'next/server'
import { and, asc, eq } from 'drizzle-orm'
import { z } from 'zod'

import db from '@/db/drizzle'
import {
	curriculum,
	lessons,
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
import { getHebrewLessonVideoIdsByLessonIds } from '@/lib/server/public-course-activity-options'

const updateScheduleSchema = z.object({
	activities: z
		.array(
			z.object({
				activityKey: z.string().trim().min(1),
				order: z.number().int().positive(),
				isEnabled: z.boolean(),
				filterConfig: z.record(z.string(), z.unknown()).optional(),
			}),
		)
		.optional(),
})

async function getStudyGroupAccess(studyGroupId: number, userId: string) {
	const group = await db.query.studyGroups.findFirst({
		where: eq(studyGroups.id, studyGroupId),
		with: {
			members: true,
		},
	})

	if (!group) return { group: null, canManage: false }

	return {
		group,
		canManage: group.teacherId === userId,
	}
}

export async function PUT(
	request: Request,
	{
		params,
	}: {
		params: Promise<{ id: string; scheduleId: string }>
	}
) {
	try {
		const userId = await getUserOrThrow()
		const { id, scheduleId } = await params
		const studyGroupId = Number(id)
		const parsedScheduleId = Number(scheduleId)

		if (!Number.isFinite(studyGroupId) || !Number.isFinite(parsedScheduleId)) {
			return NextResponse.json({ error: 'Invalid schedule id' }, { status: 400 })
		}

		const access = await getStudyGroupAccess(studyGroupId, userId)
		if (!access.group) {
			return NextResponse.json({ error: 'Study group not found' }, { status: 404 })
		}

		if (!access.canManage) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
		}

		const existingSchedule = await db.query.studyGroupSchedule.findFirst({
			where: and(
				eq(studyGroupSchedule.id, parsedScheduleId),
				eq(studyGroupSchedule.studyGroupId, studyGroupId),
			),
		})

		if (!existingSchedule) {
			return NextResponse.json({ error: 'Schedule event not found' }, { status: 404 })
		}

		const body = await request.json()
		const parsed = updateScheduleSchema.safeParse({
			activities: Array.isArray(body.activities) ? body.activities : undefined,
		})

		if (!parsed.success) {
			return NextResponse.json(
				{ error: parsed.error.issues[0]?.message || 'Invalid schedule update' },
				{ status: 400 },
			)
		}

		const { meta, userNotes } = parseStudyGroupScheduleMeta(existingSchedule.notes)

		const [updated] = await db
			.update(studyGroupSchedule)
			.set({
				notes: serializeStudyGroupScheduleMeta({
					studyGroupCourseId: meta?.studyGroupCourseId ?? null,
					groupCourseName: meta?.groupCourseName ?? null,
					title: meta?.title ?? null,
					userNotes: userNotes ?? null,
					platformCourseId: meta?.platformCourseId ?? null,
					activities: parsed.data.activities ?? meta?.activities ?? [],
				}),
				updatedAt: new Date(),
			})
			.where(
				and(
					eq(studyGroupSchedule.id, parsedScheduleId),
					eq(studyGroupSchedule.studyGroupId, studyGroupId),
				),
			)
			.returning({
				id: studyGroupSchedule.id,
				classDate: studyGroupSchedule.classDate,
				notes: studyGroupSchedule.notes,
			})

		const eventRow = await db
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
				eq(studyGroupSchedule.id, studyGroupScheduleLessons.scheduleId),
			)
			.leftJoin(lessons, eq(studyGroupScheduleLessons.lessonId, lessons.id))
			.leftJoin(units, eq(lessons.unitId, units.id))
			.leftJoin(curriculum, eq(units.courseId, curriculum.id))
			.where(
				and(
					eq(studyGroupSchedule.id, updated.id),
					eq(studyGroupSchedule.studyGroupId, studyGroupId),
				),
			)
			.orderBy(asc(studyGroupSchedule.classDate))
			.then((rows) => rows[0] ?? null)

		const { meta: updatedMeta, userNotes: updatedUserNotes } =
			parseStudyGroupScheduleMeta(eventRow?.notes ?? updated.notes)

		const lessonVideoIds = eventRow?.lessonId
			? (
					await getHebrewLessonVideoIdsByLessonIds([eventRow.lessonId])
				).get(eventRow.lessonId) ?? null
			: null

		const responseEvent = {
			id: eventRow?.id ?? updated.id,
			studyGroupId,
			classDate: eventRow?.classDate ?? updated.classDate,
			title: updatedMeta?.title ?? null,
			notes: updatedUserNotes,
			studyGroupCourseId: updatedMeta?.studyGroupCourseId ?? null,
			groupCourseName: updatedMeta?.groupCourseName ?? null,
			platformCourseId: eventRow?.platformCourseId ?? updatedMeta?.platformCourseId ?? null,
			platformCourseTitle: eventRow?.platformCourseTitle ?? null,
			lessonId: eventRow?.lessonId ?? null,
			lessonTitle: eventRow?.lessonTitle ?? null,
			lessonNumber: eventRow?.lessonNumber ?? null,
			lessonScriptId: lessonVideoIds?.lessonScriptId ?? null,
			lessonScriptPartBId: lessonVideoIds?.lessonScriptPartBId ?? null,
			lessonScriptReviewId: lessonVideoIds?.lessonScriptReviewId ?? null,
			activities: updatedMeta?.activities ?? [],
		}

		return NextResponse.json({ event: responseEvent })
	} catch (error) {
		if (error instanceof Error && error.message === 'Unauthorized') {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		console.error('Error updating study group schedule:', error)
		return NextResponse.json(
			{ error: 'Failed to update study group schedule' },
			{ status: 500 },
		)
	}
}
