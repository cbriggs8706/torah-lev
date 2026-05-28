'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	buildEvenScheduleDates,
	getTargetEndDate,
} from '@/lib/public-course-scheduling'

type CuratedLesson = {
	publicCourseLessonId: number
	order: number
	lessonId: number
	title: string
	lessonNumber: string | null
	unitTitle: string | null
	platformCourseTitle: string
}

type EnrollmentLesson = {
	publicCourseLessonId: number
	order: number
	scheduledDate: string
}

type PublicCoursePlannerProps = {
	courseId: number
	isAuthenticated: boolean
	lessons: CuratedLesson[]
	initialEnrollment:
		| {
				goalDays: number
				startDate: string
				targetEndDate: string
				lessons: EnrollmentLesson[]
		  }
		| null
	onSaved?: (enrollment: {
		id: number
		goalDays: number
		startDate: string
		targetEndDate: string
		lessons: EnrollmentLesson[]
	}) => void
	onCancelEdit?: (() => void) | null
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

function buildDraftSchedule(
	lessons: CuratedLesson[],
	goalDays: number,
	existingLessons?: EnrollmentLesson[] | null
) {
	if (existingLessons?.length) {
		const byId = new Map(
			existingLessons.map((lesson) => [lesson.publicCourseLessonId, lesson])
		)

		return lessons.map((lesson) => ({
			publicCourseLessonId: lesson.publicCourseLessonId,
			order: lesson.order,
			scheduledDate:
				byId.get(lesson.publicCourseLessonId)?.scheduledDate ??
				buildEvenScheduleDates(lessons.length, goalDays)[lesson.order - 1],
		}))
	}

	const generatedDates = buildEvenScheduleDates(lessons.length, goalDays)

	return lessons.map((lesson, index) => ({
		publicCourseLessonId: lesson.publicCourseLessonId,
		order: lesson.order,
		scheduledDate: generatedDates[index],
	}))
}

export default function PublicCoursePlanner({
	courseId,
	isAuthenticated,
	lessons,
	initialEnrollment,
	onSaved,
	onCancelEdit,
}: PublicCoursePlannerProps) {
	const defaultGoalDays = initialEnrollment?.goalDays ?? Math.max(lessons.length, 1)
	const [goalDays, setGoalDays] = useState(defaultGoalDays)
	const [schedule, setSchedule] = useState(() =>
		buildDraftSchedule(lessons, defaultGoalDays, initialEnrollment?.lessons)
	)
	const [isSaving, setIsSaving] = useState(false)

	const targetEndDate = useMemo(
		() => getTargetEndDate(new Date(), goalDays).toISOString().slice(0, 10),
		[goalDays]
	)

	const regenerateSchedule = () => {
		setSchedule(buildDraftSchedule(lessons, goalDays))
	}

	const updateScheduledDate = (
		publicCourseLessonId: number,
		scheduledDate: string
	) => {
		setSchedule((current) =>
			current.map((lesson) =>
				lesson.publicCourseLessonId === publicCourseLessonId
					? { ...lesson, scheduledDate }
					: lesson
			)
		)
	}

	const handleSave = async () => {
		if (!isAuthenticated) {
			toast.error('Please sign in to start this course.')
			return
		}

		if (schedule.some((lesson) => !lesson.scheduledDate)) {
			toast.error('Please set a date for every lesson.')
			return
		}

		setIsSaving(true)

		try {
			const response = await fetch(`/api/public-courses/${courseId}/enrollment`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					goalDays,
					lessonSchedules: schedule,
				}),
			})
			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.error || 'Failed to save course plan')
			}

			const savedEnrollment = data.enrollment
				? {
						id: data.enrollment.id,
						goalDays: data.enrollment.goalDays,
						startDate: new Date(data.enrollment.startDate)
							.toISOString()
							.slice(0, 10),
						targetEndDate: new Date(data.enrollment.targetEndDate)
							.toISOString()
							.slice(0, 10),
						lessons: (data.enrollment.lessons ?? []).map((lesson: any) => ({
							publicCourseLessonId: lesson.publicCourseLessonId,
							order: lesson.order,
							scheduledDate: new Date(lesson.scheduledDate)
								.toISOString()
								.slice(0, 10),
						})),
				  }
				: null

			toast.success(
				initialEnrollment
					? 'Your public course schedule was updated.'
					: 'Your public course plan is ready.'
			)
			if (savedEnrollment) {
				onSaved?.(savedEnrollment)
			}
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Failed to save course plan'
			)
		} finally {
			setIsSaving(false)
		}
	}

	return (
		<div className="rounded-2xl border bg-white p-5 shadow-sm space-y-5">
			<div className="space-y-1">
				<h2 className="text-xl font-semibold text-slate-900">
					Your Self-Paced Plan
				</h2>
				<p className="text-sm text-slate-600">
					Start today, choose how many days you want, and adjust any lesson date
					before saving.
				</p>
			</div>

			<div className="grid gap-4 md:grid-cols-[180px_1fr_auto] md:items-end">
				<div className="space-y-2">
					<Label htmlFor="goal-days">Goal length in days</Label>
					<Input
						id="goal-days"
						type="number"
						min={1}
						value={goalDays}
						onChange={(event) =>
							setGoalDays(Math.max(1, Number(event.target.value) || 1))
						}
					/>
				</div>
				<div className="rounded-xl border bg-slate-50 px-4 py-3 text-sm text-slate-700">
					Plan starts today and currently lands on{' '}
					<span className="font-semibold">{formatDateLabel(targetEndDate)}</span>.
				</div>
				<Button type="button" variant="ghost" onClick={regenerateSchedule}>
					Auto-fill Dates
				</Button>
			</div>

			<div className="space-y-3">
				{lessons.map((lesson, index) => {
					const scheduled = schedule.find(
						(item) => item.publicCourseLessonId === lesson.publicCourseLessonId
					)

					return (
						<div
							key={lesson.publicCourseLessonId}
							className="grid gap-3 rounded-xl border bg-slate-50 p-4 md:grid-cols-[minmax(0,1fr)_180px]"
						>
							<div className="space-y-1">
								<p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
									Lesson {index + 1}
								</p>
								<h3 className="text-base font-semibold text-slate-900">
									{lesson.lessonNumber
										? `Lesson ${lesson.lessonNumber}: ${lesson.title}`
										: lesson.title}
								</h3>
								<p className="text-sm text-slate-600">
									{lesson.platformCourseTitle}
									{lesson.unitTitle ? ` · ${lesson.unitTitle}` : ''}
								</p>
							</div>
							<div className="space-y-2">
								<Label htmlFor={`lesson-date-${lesson.publicCourseLessonId}`}>
									Scheduled date
								</Label>
								<Input
									id={`lesson-date-${lesson.publicCourseLessonId}`}
									type="date"
									value={scheduled?.scheduledDate ?? ''}
									onChange={(event) =>
										updateScheduledDate(
											lesson.publicCourseLessonId,
											event.target.value
										)
									}
								/>
							</div>
						</div>
					)
				})}
			</div>

			<Button type="button" onClick={handleSave} disabled={isSaving}>
				{isSaving
					? 'Saving Plan...'
					: initialEnrollment
					? 'Update Plan'
					: 'Start Public Course'}
			</Button>
			{onCancelEdit ? (
				<Button type="button" variant="ghost" onClick={onCancelEdit}>
					Cancel
				</Button>
			) : null}
		</div>
	)
}
