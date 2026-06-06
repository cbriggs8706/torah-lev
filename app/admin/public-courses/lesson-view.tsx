'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
	getPublicCourseActivityDefinition,
	type PublicCourseActivityKey,
} from '@/lib/public-course-activities'

import {
	ActivityFilterEditor,
	ActivityToggleRow,
	type ActivityFilterOptions,
	type DraftActivity,
	type DraftLesson,
	type PublicCourseRecord,
	formatLessonLabel,
	mapCuratedLessonToDraftLesson,
} from './shared'

function moveActivity(
	activities: DraftActivity[],
	activityIndex: number,
	direction: -1 | 1
) {
	const nextIndex = activityIndex + direction
	if (activityIndex === 0 || nextIndex < 1 || nextIndex >= activities.length) {
		return activities
	}

	const next = activities.slice()
	;[next[activityIndex], next[nextIndex]] = [next[nextIndex], next[activityIndex]]
	return next
}

export default function PublicCourseLessonAdminPage() {
	const navigate = useNavigate()
	const { courseId, publicCourseLessonId } = useParams()
	const parsedCourseId = Number(courseId)
	const parsedPublicCourseLessonId = Number(publicCourseLessonId)

	const [course, setCourse] = useState<PublicCourseRecord | null>(null)
	const [lessons, setLessons] = useState<DraftLesson[]>([])
	const [activityOptionsByCourseId, setActivityOptionsByCourseId] = useState<
		Record<number, ActivityFilterOptions>
	>({})
	const [isSaving, setIsSaving] = useState(false)
	const [isLoading, setIsLoading] = useState(true)

	const selectedLessonIndex = useMemo(
		() =>
			lessons.findIndex(
				(lesson) => lesson.publicCourseLessonId === parsedPublicCourseLessonId
			),
		[lessons, parsedPublicCourseLessonId]
	)

	const selectedLesson =
		selectedLessonIndex >= 0 ? lessons[selectedLessonIndex] ?? null : null

	const loadActivityOptions = useCallback(
		async (platformCourseId: number) => {
			if (activityOptionsByCourseId[platformCourseId]) return

			const response = await fetch(
				`/api/public-course-activity-options?platformCourseId=${platformCourseId}`
			)
			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.error || 'Failed to load activity filter options')
			}

			setActivityOptionsByCourseId((current) => ({
				...current,
				[platformCourseId]: data,
			}))
		},
		[activityOptionsByCourseId]
	)

	useEffect(() => {
		if (!Number.isFinite(parsedCourseId) || !Number.isFinite(parsedPublicCourseLessonId)) {
			toast.error('Invalid lesson route.')
			navigate('/public-courses')
			return
		}

		const loadPage = async () => {
			setIsLoading(true)

			const [courseResponse, lessonsResponse] = await Promise.all([
				fetch(`/api/public-courses/${parsedCourseId}`),
				fetch(`/api/public-courses/${parsedCourseId}/lessons`),
			])

			const courseData = await courseResponse.json()
			const lessonsData = await lessonsResponse.json()

			if (!courseResponse.ok) {
				throw new Error(courseData.error || 'Failed to load course')
			}

			if (!lessonsResponse.ok) {
				throw new Error(lessonsData.error || 'Failed to load curated lessons')
			}

			setCourse({
				...courseData.course,
				lessons: lessonsData.lessons ?? [],
			})

			const nextLessons = (lessonsData.lessons ?? []).map(mapCuratedLessonToDraftLesson)
			setLessons(nextLessons)

			await Promise.all(
				Array.from(new Set(nextLessons.map((lesson: DraftLesson) => lesson.platformCourseId))).map(
					(platformCourseId) => loadActivityOptions(platformCourseId)
				)
			)
		}

		void loadPage()
			.catch((error) => {
				toast.error(error instanceof Error ? error.message : 'Failed to load lesson')
			})
			.finally(() => setIsLoading(false))
	}, [loadActivityOptions, navigate, parsedCourseId, parsedPublicCourseLessonId])

	const updateSelectedLessonActivities = (
		updater: (activities: DraftActivity[]) => DraftActivity[]
	) => {
		setLessons((current) =>
			current.map((lesson, index) =>
				index === selectedLessonIndex
					? { ...lesson, activities: updater(lesson.activities) }
					: lesson
			)
		)
	}

	const handleSave = async () => {
		if (!course || !selectedLesson) return

		setIsSaving(true)

		try {
			const selectedLessonKey = {
				platformCourseId: selectedLesson.platformCourseId,
				lessonId: selectedLesson.lessonId,
			}

			const lessonsResponse = await fetch(
				`/api/public-courses/${parsedCourseId}/lessons`,
				{
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						lessons: lessons.map((lesson, index) => ({
							platformCourseId: lesson.platformCourseId,
							lessonId: lesson.lessonId,
							order: index + 1,
							activities: lesson.activities.map((activity, activityIndex) => ({
								activityKey: activity.activityKey,
								order: activityIndex + 1,
								isEnabled:
									activity.activityKey === 'lesson_script'
										? true
										: activity.isEnabled,
								filterConfig: activity.filterConfig,
							})),
						})),
					}),
				}
			)
			const lessonsData = await lessonsResponse.json()

			if (!lessonsResponse.ok) {
				throw new Error(lessonsData.error || 'Failed to save lesson activities')
			}

			const nextLessons = (lessonsData.lessons ?? []).map(mapCuratedLessonToDraftLesson)
			setLessons(nextLessons)
			const refreshedSelectedLesson = nextLessons.find(
				(lesson) =>
					lesson.platformCourseId === selectedLessonKey.platformCourseId &&
					lesson.lessonId === selectedLessonKey.lessonId
			)

			if (
				refreshedSelectedLesson?.publicCourseLessonId &&
				refreshedSelectedLesson.publicCourseLessonId !== parsedPublicCourseLessonId
			) {
				navigate(
					`/public-courses/${parsedCourseId}/lessons/${refreshedSelectedLesson.publicCourseLessonId}`,
					{ replace: true }
				)
			}

			toast.success('Lesson activities updated.')
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Failed to save lesson activities'
			)
		} finally {
			setIsSaving(false)
		}
	}

	if (isLoading) {
		return (
			<div className="px-6 py-5">
				<div className="rounded-2xl border bg-white p-6 text-sm text-slate-500 shadow-sm">
					Loading lesson curation...
				</div>
			</div>
		)
	}

	if (!course || !selectedLesson) {
		return (
			<div className="px-6 py-5">
				<div className="rounded-2xl border bg-white p-6 text-sm text-slate-500 shadow-sm">
					Could not find that curated lesson.
				</div>
			</div>
		)
	}

	const activityOptions = activityOptionsByCourseId[selectedLesson.platformCourseId] ?? null

	return (
		<div className="space-y-6 px-6 py-5">
			<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
				<div className="space-y-1">
					<div className="text-sm text-slate-500">
						<Link to="/public-courses" className="hover:text-slate-700">
							Public Courses
						</Link>
						{' / '}
						<Link
							to="/public-courses"
							onClick={(event) => {
								event.preventDefault()
								navigate('/public-courses')
							}}
							className="hover:text-slate-700"
						>
							{course.name}
						</Link>
					</div>
					<h1 className="text-2xl font-semibold text-slate-900">
						{formatLessonLabel(selectedLesson)}
					</h1>
					<p className="text-sm text-slate-600">
						Curate the activities for this lesson inside {course.name}.
					</p>
				</div>

				<div className="flex flex-wrap gap-2">
					<Button type="button" variant="ghost" onClick={() => navigate('/public-courses')}>
						Back to Courses
					</Button>
					<Button type="button" onClick={handleSave} disabled={isSaving}>
						{isSaving ? 'Saving...' : 'Save Lesson'}
					</Button>
				</div>
			</div>

			<div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
				<div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
					<h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-700">
						Course Lessons
					</h2>
					{lessons.map((lesson, index) => (
						<button
							key={lesson.publicCourseLessonId ?? `${lesson.lessonId}-${index}`}
							type="button"
							onClick={() =>
								navigate(`/public-courses/${parsedCourseId}/lessons/${lesson.publicCourseLessonId}`)
							}
							className={`w-full rounded-2xl border p-4 text-left transition ${
								lesson.publicCourseLessonId === parsedPublicCourseLessonId
									? 'border-sky-300 bg-sky-50'
									: 'border-slate-200 bg-slate-50 hover:bg-slate-100'
							}`}
						>
							<p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
								{index + 1}. {lesson.platformCourseTitle}
							</p>
							<p className="mt-1 font-semibold text-slate-900">
								{formatLessonLabel(lesson)}
							</p>
							{lesson.unitTitle ? (
								<p className="mt-1 text-sm text-slate-500">{lesson.unitTitle}</p>
							) : null}
						</button>
					))}
				</div>

				<div className="rounded-2xl border bg-white p-5 shadow-sm space-y-4">
					<div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
						<p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
							{selectedLesson.platformCourseTitle}
						</p>
						<p className="mt-2 text-sm text-slate-600">
							{selectedLesson.unitTitle ?? 'No unit assigned'}
						</p>
					</div>

					<div className="space-y-3">
						<h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-700">
							Activities
						</h2>
						{selectedLesson.activities.map((activity, activityIndex) => (
							<ActivityToggleRow
								key={activity.activityKey}
								activity={activity}
								activityIndex={activityIndex}
								totalActivities={selectedLesson.activities.length}
								onEnabledChange={(checked) =>
									updateSelectedLessonActivities((activities) =>
										activities.map((item, itemIndex) =>
											itemIndex === activityIndex
												? { ...item, isEnabled: checked }
												: item
										)
									)
								}
								onMove={(direction) =>
									updateSelectedLessonActivities((activities) =>
										moveActivity(activities, activityIndex, direction)
									)
								}
							>
								{activity.activityKey === 'lesson_script' ? (
									<div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
										<div className="flex flex-wrap items-center justify-between gap-3">
											<div>
												<p className="font-medium text-slate-900">Display Video Text</p>
												<p className="text-xs text-slate-500">
													Only affects scheduled public/group-course learners.
													Regular video pages still always show the text.
												</p>
											</div>
											<div className="flex items-center gap-2">
												<input
													id={`display-script-${selectedLesson.lessonId}-${activityIndex}`}
													type="checkbox"
													checked={activity.filterConfig.displayScript ?? true}
													onChange={(event) =>
														updateSelectedLessonActivities((activities) =>
															activities.map((item, itemIndex) =>
																itemIndex === activityIndex
																	? {
																			...item,
																			filterConfig: {
																				...item.filterConfig,
																				displayScript: event.target.checked,
																			},
																	  }
																	: item
															)
														)
													}
													className="h-4 w-4 rounded border-slate-300"
												/>
												<label
													htmlFor={`display-script-${selectedLesson.lessonId}-${activityIndex}`}
													className="text-sm font-medium text-slate-700"
												>
													Display Video Text
												</label>
											</div>
										</div>
									</div>
								) : null}
								<ActivityFilterEditor
									activity={activity}
									options={activityOptions}
									onChange={(nextFilters) =>
										updateSelectedLessonActivities((activities) =>
											activities.map((item, itemIndex) =>
												itemIndex === activityIndex
													? { ...item, filterConfig: nextFilters }
													: item
											)
										)
									}
								/>
							</ActivityToggleRow>
						))}
					</div>

					<div className="flex justify-between">
						<Button
							type="button"
							variant="ghost"
							disabled={selectedLessonIndex <= 0}
							onClick={() => {
								const previousLesson = lessons[selectedLessonIndex - 1]
								if (!previousLesson?.publicCourseLessonId) return
								navigate(
									`/public-courses/${parsedCourseId}/lessons/${previousLesson.publicCourseLessonId}`
								)
							}}
						>
							Previous Lesson
						</Button>
						<Button
							type="button"
							variant="ghost"
							disabled={selectedLessonIndex < 0 || selectedLessonIndex >= lessons.length - 1}
							onClick={() => {
								const nextLesson = lessons[selectedLessonIndex + 1]
								if (!nextLesson?.publicCourseLessonId) return
								navigate(
									`/public-courses/${parsedCourseId}/lessons/${nextLesson.publicCourseLessonId}`
								)
							}}
						>
							Next Lesson
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}
