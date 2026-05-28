import Image from 'next/image'
import Link from 'next/link'
import { and, asc, eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'

import db from '@/db/drizzle'
import {
	curriculum,
	lessons,
	studyGroupCourse,
	studyGroupMembers,
	studyGroupSchedule,
	studyGroupScheduleLessons,
	studyGroups,
	units,
} from '@/db/schema'
import { getSession } from '@/lib/auth'
import { parseStudyGroupScheduleMeta } from '@/lib/study-group-schedule-meta'
import StudyGroupJoinButton from '@/components/courses/study-group-join-button'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function StudyGroupCourseDetailPage({
	params,
}: {
	params: Promise<{ studyGroupId: string; courseId: string }>
}) {
	const { studyGroupId: rawStudyGroupId, courseId: rawCourseId } = await params
	const studyGroupId = Number(rawStudyGroupId)
	const courseId = Number(rawCourseId)

	if (!Number.isFinite(studyGroupId) || !Number.isFinite(courseId)) {
		notFound()
	}

	const session = await getSession()
	const userId = session?.user?.id ?? null

	const course = await db.query.studyGroupCourse.findFirst({
		where: and(
			eq(studyGroupCourse.id, courseId),
			eq(studyGroupCourse.studyGroupId, studyGroupId)
		),
		with: {
			studyGroup: {
				with: {
					teacher: true,
				},
			},
		},
	})

	if (!course || course.studyGroup?.groupType !== 'Public') {
		notFound()
	}

	const membership = userId
		? await db.query.studyGroupMembers.findFirst({
				where: and(
					eq(studyGroupMembers.studyGroupId, studyGroupId),
					eq(studyGroupMembers.userId, userId)
				),
				columns: { id: true },
			})
		: null

	const scheduleRows = await db
		.select({
			id: studyGroupSchedule.id,
			classDate: studyGroupSchedule.classDate,
			notes: studyGroupSchedule.notes,
			platformCourseTitle: curriculum.title,
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
		.orderBy(asc(studyGroupSchedule.classDate))

	const courseEvents = scheduleRows
		.map((row) => {
			const { meta, userNotes } = parseStudyGroupScheduleMeta(row.notes)

			return {
				id: row.id,
				classDate: row.classDate,
				title: meta?.title ?? null,
				userNotes,
				studyGroupCourseId: meta?.studyGroupCourseId ?? null,
				platformCourseTitle: row.platformCourseTitle,
				lessonTitle: row.lessonTitle,
				lessonNumber: row.lessonNumber,
			}
		})
		.filter((event) => event.studyGroupCourseId === courseId)

	return (
		<div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
			<div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
				<div className="space-y-6">
					<div className="relative h-72 overflow-hidden rounded-3xl bg-slate-100">
						<Image
							src={course.imageUrl}
							alt={course.name}
							fill
							sizes="(min-width: 1024px) 60vw, 100vw"
							className="object-cover"
						/>
					</div>

					<div className="space-y-3">
						<p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
							Public Study Group Course
						</p>
						<h1 className="text-3xl font-bold text-slate-900">{course.name}</h1>
						<p className="text-base text-slate-600">
							This course belongs to the public study group{' '}
							<span className="font-semibold">{course.studyGroup.name}</span>.
						</p>
						<p className="text-sm text-slate-600">
							Instructor: {course.studyGroup.teacher?.userName ?? 'Unknown'}
						</p>
					</div>

					<div className="rounded-2xl border bg-white p-5 shadow-sm space-y-4">
						<div className="space-y-1">
							<h2 className="text-xl font-semibold text-slate-900">
								Scheduled Group Sessions
							</h2>
							<p className="text-sm text-slate-600">
								These are the lessons currently organized for this study-group
								course.
							</p>
						</div>

						{courseEvents.length > 0 ? (
							<div className="space-y-3">
								{courseEvents.map((event) => (
									<div
										key={event.id}
										className="rounded-xl border bg-slate-50 p-4"
									>
										<p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
											{new Date(event.classDate).toLocaleString()}
										</p>
										<h3 className="mt-1 text-base font-semibold text-slate-900">
											{event.lessonNumber
												? `Lesson ${event.lessonNumber}: ${event.lessonTitle}`
												: event.title || 'Custom session'}
										</h3>
										{event.platformCourseTitle ? (
											<p className="mt-1 text-sm text-slate-600">
												{event.platformCourseTitle}
											</p>
										) : null}
										{event.userNotes ? (
											<p className="mt-2 text-sm text-slate-600">
												{event.userNotes}
											</p>
										) : null}
									</div>
								))}
							</div>
						) : (
							<div className="rounded-xl border border-dashed p-6 text-sm text-slate-600">
								No sessions have been scheduled yet for this group course.
							</div>
						)}
					</div>
				</div>

				<div className="rounded-2xl border bg-white p-5 shadow-sm space-y-4">
					<div className="space-y-1">
						<h2 className="text-xl font-semibold text-slate-900">
							Join This Group
						</h2>
						<p className="text-sm text-slate-600">
							Join the public study group to access its dashboard and scheduled
							class flow.
						</p>
					</div>

					<StudyGroupJoinButton
						studyGroupId={studyGroupId}
						isAuthenticated={Boolean(userId)}
						initiallyJoined={Boolean(membership) || course.studyGroup.teacherId === userId}
					/>

					<Link href={`/study-group/${studyGroupId}`}>
						<Button type="button" variant="ghost" className="w-full">
							Open Study Group Page
						</Button>
					</Link>
				</div>
			</div>
		</div>
	)
}

