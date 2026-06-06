'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Lock } from 'lucide-react'

import PublicCoursePlanner from '@/components/courses/public-course-planner'
import { Button } from '@/components/ui/button'
import {
	buildPublicCourseActivityHref,
	getPublicCourseActivityDefinition,
	type PublicCourseActivityFilters,
	type PublicCourseActivityKey,
	type PublicCourseActivityStatus,
} from '@/lib/public-course-activities'

type LessonActivity = {
	id: number
	activityKey: PublicCourseActivityKey
	order: number
	isEnabled: boolean
	filterConfig: PublicCourseActivityFilters
}

type PlannerLesson = {
	publicCourseLessonId: number
	order: number
	lessonId: number
	title: string
	lessonNumber: string | null
	unitTitle: string | null
	platformCourseId: number
	platformCourseTitle: string
	lessonScriptId: number | null
	activities: LessonActivity[]
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
	activityProgress: Array<{
		publicCourseLessonId: number
		publicCourseLessonActivityId: number
		status: PublicCourseActivityStatus
		scorePercent: number | null
		completedAt: string | null
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
		initialEnrollment,
	)
	const [isEditingPlan, setIsEditingPlan] = useState(!initialEnrollment)

	const lessonsWithSchedule = useMemo(() => {
		const scheduledDates = new Map(
			(enrollment?.lessons ?? []).map((lesson) => [
				lesson.publicCourseLessonId,
				lesson.scheduledDate,
			]),
		)
		const progressByActivityId = new Map(
			(enrollment?.activityProgress ?? []).map((progress) => [
				progress.publicCourseLessonActivityId,
				progress,
			]),
		)

		return lessons.map((lesson) => ({
			...lesson,
			scheduledDate: scheduledDates.get(lesson.publicCourseLessonId) ?? null,
			activities: lesson.activities
				.filter((activity) => activity.isEnabled)
				.sort((a, b) => a.order - b.order)
				.map((activity) => ({
					...activity,
					definition: getPublicCourseActivityDefinition(activity.activityKey),
					progress: progressByActivityId.get(activity.id) ?? null,
				})),
		}))
	}, [enrollment, lessons])

	const nextActivityId = useMemo(() => {
		for (const lesson of lessonsWithSchedule) {
			for (const activity of lesson.activities) {
				if (activity.progress?.status !== 'completed') {
					return activity.id
				}
			}
		}

		return null
	}, [lessonsWithSchedule])

	return (
		<div className="space-y-6">
			{isEditingPlan || !enrollment ? (
				<PublicCoursePlanner
					courseId={courseId}
					isAuthenticated={isAuthenticated}
					lessons={lessons}
					initialEnrollment={enrollment}
					onSaved={(savedEnrollment) => {
						setEnrollment((current) => ({
							...savedEnrollment,
							activityProgress: current?.activityProgress ?? [],
						}))
						setIsEditingPlan(false)
					}}
					onCancelEdit={enrollment ? () => setIsEditingPlan(false) : null}
				/>
			) : (
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
								{lessons.length} lessons scheduled over {enrollment.goalDays}{' '}
								day
								{enrollment.goalDays === 1 ? '' : 's'} through{' '}
								<span className="font-semibold">
									{formatDateLabel(enrollment.targetEndDate)}
								</span>
								.
							</p>
						</div>
						<Button
							type="button"
							variant="ghost"
							onClick={() => setIsEditingPlan(true)}
						>
							Reset Goals / Edit Plan
						</Button>
					</div>
				</div>
			)}

			<div className="space-y-8">
				{lessonsWithSchedule.map((lesson, index) => {
					const firstActivity = lesson.activities[0] ?? null
					const firstCompleted = firstActivity?.progress?.status === 'completed'
					const lessonTotalActivities = lesson.activities.length
					const lessonCompletedActivities = lesson.activities.filter(
						(activity) => activity.progress?.status === 'completed',
					).length
					const lessonProgressPercent =
						lessonTotalActivities > 0
							? (lessonCompletedActivities / lessonTotalActivities) * 100
							: 0

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
										<div className="w-full max-w-[310px] rounded-2xl border border-white/20 bg-white/10 p-4 shadow-sm backdrop-blur-sm md:w-[310px]">
											<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-100">
												Due Date
											</p>
											<p className="mt-1 text-xl font-bold text-white">
												{lesson.scheduledDate
													? formatDateLabel(lesson.scheduledDate)
													: formatDateLabel(enrollment.targetEndDate)}
											</p>
											<div className="mt-3 h-3 overflow-hidden rounded-full bg-white/20">
												<div
													className="h-full rounded-full bg-white transition-all duration-500"
													style={{ width: `${lessonProgressPercent}%` }}
												/>
											</div>
											<p className="mt-2 text-sm font-medium text-sky-50">
												{lessonCompletedActivities} of {lessonTotalActivities}{' '}
												activities completed
											</p>
										</div>
									</div>
								</div>
							</div>

							<div
								dir="rtl"
								className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
							>
								{lesson.activities.map((activity, activityIndex) => {
									if (!activity.definition) return null

									const isFirst = activityIndex === 0
									const isCompleted = activity.progress?.status === 'completed'
									const isCurrent = activity.id === nextActivityId
									const isLocked = !isFirst && !firstCompleted
									const href = buildPublicCourseActivityHref({
										activityKey: activity.activityKey,
										courseId: lesson.platformCourseId,
										lessonNumber: lesson.lessonNumber ?? String(index + 1),
										publicCourseId: courseId,
										publicCourseLessonId: lesson.publicCourseLessonId,
										enrollmentId: enrollment?.id ?? null,
										lessonScriptId: lesson.lessonScriptId,
										filterConfig: activity.filterConfig,
									})

									const cardContent = (
										<div
											dir="ltr"
											className={`relative flex min-h-[220px] flex-col items-center justify-between rounded-xl border-2 border-b-4 p-3 text-center transition ${
												isCurrent
													? 'border-sky-400 bg-sky-100 shadow-md'
													: isLocked || !href
														? 'border-slate-200 bg-slate-100 text-slate-400'
														: 'bg-white hover:bg-black/5 hover:shadow-md'
											}`}
										>
											{isCurrent ? (
												<div className="absolute -top-6 inset-x-0 mx-auto w-fit rounded-xl border-2 bg-white px-3 py-2.5 font-bold uppercase tracking-wide text-sky-600 animate-bounce z-20">
													Start
													<div className="absolute left-1/2 -bottom-2 h-0 w-0 -translate-x-1/2 transform border-x-8 border-x-transparent border-t-8" />
												</div>
											) : null}

											<div className="relative">
												<Image
													src={activity.definition.iconSrc}
													alt={activity.definition.label}
													height={70}
													width={93}
													className={`rounded-lg border object-contain drop-shadow-md ${
														isLocked ? 'opacity-45 grayscale' : ''
													}`}
												/>

												{isLocked ? (
													<div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 bg-white shadow-sm">
														<Lock className="h-3.5 w-3.5 text-slate-500" />
													</div>
												) : null}
											</div>

											<div className="space-y-2">
												{/* <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
													Activity
												</p> */}
												<p className="text-center font-bold text-neutral-700">
													{activity.definition.label}
												</p>
												<p className="text-xs text-slate-500">
													{isLocked
														? 'Finish the introduction first to unlock this activity.'
														: `Open this lesson's ${activity.definition.label.toLowerCase()}.`}
												</p>
											</div>

											<div
												className={`w-full rounded-lg px-3 py-2 text-xs font-semibold ${
													isCurrent
														? 'bg-sky-600 text-white'
														: 'bg-slate-100 text-slate-600'
												}`}
											>
												{isCurrent
													? 'Start here'
													: isCompleted
														? 'Review'
														: 'Not started'}
											</div>
										</div>
									)

									if (isLocked || !href) {
										return (
											<div
												key={`${lesson.publicCourseLessonId}-${activity.activityKey}`}
												className="group"
											>
												{cardContent}
											</div>
										)
									}

									return (
										<Link
											key={`${lesson.publicCourseLessonId}-${activity.activityKey}`}
											href={href}
											className="group"
										>
											{cardContent}
										</Link>
									)
								})}
							</div>
						</section>
					)
				})}
			</div>
		</div>
	)
}
