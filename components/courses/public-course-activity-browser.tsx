'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'

import PublicCoursePlanner from '@/components/courses/public-course-planner'
import { Button } from '@/components/ui/button'
import { getHebrewScheduledActivityLinks } from '@/lib/study-group-activities'

type PlannerLesson = {
	publicCourseLessonId: number
	order: number
	lessonId: number
	title: string
	lessonNumber: string | null
	unitTitle: string | null
	platformCourseId: number
	platformCourseTitle: string
}

type EnrollmentState = {
	id: number
	goalDays: number
	startDate: string
	targetEndDate: string
	lessons: Array<{
		publicCourseLessonId: number
		order: number
		scheduledDate: string
	}>
}

type PublicCourseActivityBrowserProps = {
	courseId: number
	isAuthenticated: boolean
	lessons: PlannerLesson[]
	initialEnrollment: EnrollmentState | null
}

function formatDateLabel(value: string) {
	const parsed = new Date(`${value}T00:00:00`)
	if (Number.isNaN(parsed.getTime())) return value

	return parsed.toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	})
}

export default function PublicCourseActivityBrowser({
	courseId,
	isAuthenticated,
	lessons,
	initialEnrollment,
}: PublicCourseActivityBrowserProps) {
	const [enrollment, setEnrollment] = useState<EnrollmentState | null>(
		initialEnrollment
	)
	const [isEditingPlan, setIsEditingPlan] = useState(!initialEnrollment)

	const lessonsWithSchedule = useMemo(() => {
		const scheduledDates = new Map(
			(enrollment?.lessons ?? []).map((lesson) => [
				lesson.publicCourseLessonId,
				lesson.scheduledDate,
			])
		)

		return lessons.map((lesson) => ({
			...lesson,
			scheduledDate:
				scheduledDates.get(lesson.publicCourseLessonId) ?? null,
		}))
	}, [enrollment, lessons])

	if (isEditingPlan || !enrollment) {
		return (
			<PublicCoursePlanner
				courseId={courseId}
				isAuthenticated={isAuthenticated}
				lessons={lessons}
				initialEnrollment={enrollment}
				onSaved={(savedEnrollment) => {
					setEnrollment(savedEnrollment)
					setIsEditingPlan(false)
				}}
				onCancelEdit={enrollment ? () => setIsEditingPlan(false) : null}
			/>
		)
	}

	return (
		<div className="space-y-6">
			<div className="rounded-2xl border bg-white p-5 shadow-sm">
				<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<div className="space-y-1">
						<p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
							Your Plan
						</p>
						<h2 className="text-2xl font-semibold text-slate-900">
							Lesson Activity Path
						</h2>
						<p className="text-sm text-slate-600">
							{lessons.length} lessons scheduled over {enrollment.goalDays} day
							{enrollment.goalDays === 1 ? '' : 's'} through{' '}
							<span className="font-semibold">
								{formatDateLabel(enrollment.targetEndDate)}
							</span>
							.
						</p>
					</div>
					<Button type="button" variant="ghost" onClick={() => setIsEditingPlan(true)}>
						Reset Goals / Edit Plan
					</Button>
				</div>
			</div>

			<div className="space-y-8">
				{lessonsWithSchedule.map((lesson, index) => {
					const activityLinks = getHebrewScheduledActivityLinks({
						courseId: lesson.platformCourseId,
						lessonNumber: lesson.lessonNumber ?? String(index + 1),
						publicCourseId: courseId,
						publicCourseLessonId: lesson.publicCourseLessonId,
						enrollmentId: enrollment.id,
					})

					return (
						<section key={lesson.publicCourseLessonId} className="space-y-4">
							<div className="overflow-hidden rounded-2xl border border-sky-300 shadow-sm">
								<div className="bg-sky-600 px-5 py-4 text-white">
									<div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
										<div>
											<p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100">
												{lesson.scheduledDate
													? `Scheduled ${formatDateLabel(lesson.scheduledDate)}`
													: 'Scheduled lesson'}
											</p>
											<h2 className="text-2xl font-bold">
												{lesson.lessonNumber
													? `Lesson ${lesson.lessonNumber}: ${lesson.title}`
													: `Lesson ${index + 1}: ${lesson.title}`}
											</h2>
										</div>
										<p className="text-sm font-medium text-sky-100">
											{lesson.platformCourseTitle}
											{lesson.unitTitle ? ` · ${lesson.unitTitle}` : ''}
										</p>
									</div>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
								{activityLinks.map((activity) => (
									<Link
										key={`${lesson.publicCourseLessonId}-${activity.key}`}
										href={activity.href}
										className="group"
									>
										<div className="relative flex min-h-[220px] flex-col items-center justify-between rounded-xl border-2 border-b-4 bg-white p-3 text-center transition hover:bg-black/5 hover:shadow-md">
											<div className="min-[24px] flex w-full items-center justify-end" />
											<Image
												src={activity.iconSrc}
												alt={activity.label}
												height={70}
												width={93}
												className="rounded-lg border object-contain drop-shadow-md"
											/>
											<div className="space-y-2">
												<p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
													Activity
												</p>
												<p className="text-neutral-700 text-center font-bold">
													{activity.label}
												</p>
												<p className="text-xs text-slate-500">
													Open this lesson&apos;s {activity.label.toLowerCase()} set
												</p>
											</div>
											<div className="w-full rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
												Not started
											</div>
										</div>
									</Link>
								))}
							</div>
						</section>
					)
				})}
			</div>
		</div>
	)
}

