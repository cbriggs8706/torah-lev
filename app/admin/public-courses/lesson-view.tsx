'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { type PublicCourseActivityKey } from '@/lib/public-course-activities'

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
	direction: -1 | 1,
) {
	const nextIndex = activityIndex + direction
	if (activityIndex === 0 || nextIndex < 1 || nextIndex >= activities.length) {
		return activities
	}

	const next = activities.slice()
	;[next[activityIndex], next[nextIndex]] = [
		next[nextIndex],
		next[activityIndex],
	]
	return next
}

function insertActivity(
	activities: DraftActivity[],
	activityKey: PublicCourseActivityKey,
	insertAfterKey: PublicCourseActivityKey | null = 'lesson_script',
) {
	if (activities.some((activity) => activity.activityKey === activityKey)) {
		return activities
	}

	const next = activities.slice()
	const anchorIndex =
		insertAfterKey == null
			? -1
			: next.findIndex((activity) => activity.activityKey === insertAfterKey)
	const insertIndex = anchorIndex >= 0 ? anchorIndex + 1 : next.length

	next.splice(insertIndex, 0, {
		activityKey,
		isEnabled: true,
		filterConfig: {},
	})

	return next
}

type VideoOption = {
	id: number
	type: string | null
	title: string | null
	hebTitle: string | null
	titleTransliteration: string | null
	lessonLabel: string | null
	courseTitles: string
	part: number | null
	order: number | null
}

const VIDEO_TYPE_LABELS: Record<string, string> = {
	lesson: 'Lesson',
	review: 'Review',
	story: 'Story',
	song: 'Song',
}

type MusicOption = {
	id: number
	title: string
	hebTitle: string | null
	titleTransliteration: string | null
	category: string | null
	order: number
}

function normalizeMusicCategory(category: string | null) {
	return (category?.trim() || 'Uncategorized').trim()
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
	const [videos, setVideos] = useState<VideoOption[]>([])
	const [videosLoaded, setVideosLoaded] = useState(false)
	const [musicLibrary, setMusicLibrary] = useState<MusicOption[]>([])
	const [musicLibraryLoaded, setMusicLibraryLoaded] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [isLoading, setIsLoading] = useState(true)

	const selectedLessonIndex = useMemo(
		() =>
			lessons.findIndex(
				(lesson) => lesson.publicCourseLessonId === parsedPublicCourseLessonId,
			),
		[lessons, parsedPublicCourseLessonId],
	)

	const selectedLesson =
		selectedLessonIndex >= 0 ? (lessons[selectedLessonIndex] ?? null) : null
	const videosByType = useMemo(() => {
		return videos
			.slice()
			.sort((a, b) => {
				const typeCompare = (a.type ?? '').localeCompare(b.type ?? '')
				if (typeCompare !== 0) return typeCompare
				const titleA =
					a.title || a.hebTitle || a.titleTransliteration || `Video ${a.id}`
				const titleB =
					b.title || b.hebTitle || b.titleTransliteration || `Video ${b.id}`
				return titleA.localeCompare(titleB)
			})
			.reduce<Record<string, VideoOption[]>>((groups, video) => {
				const typeKey = video.type || 'other'
				const list = groups[typeKey] ?? []
				list.push(video)
				groups[typeKey] = list
				return groups
		}, {})
	}, [videos])
	const musicByCategory = useMemo(() => {
		return musicLibrary
			.slice()
			.sort((a, b) => {
				const categoryCompare = normalizeMusicCategory(a.category).localeCompare(
					normalizeMusicCategory(b.category),
				)
				if (categoryCompare !== 0) return categoryCompare

				const titleA = a.title || a.titleTransliteration || `Song ${a.id}`
				const titleB = b.title || b.titleTransliteration || `Song ${b.id}`
				return titleA.localeCompare(titleB)
			})
			.reduce<Record<string, MusicOption[]>>((groups, song) => {
				const categoryKey = normalizeMusicCategory(song.category)
				const list = groups[categoryKey] ?? []
				list.push(song)
				groups[categoryKey] = list
				return groups
			}, {})
	}, [musicLibrary])

	const loadActivityOptions = useCallback(
		async (platformCourseId: number) => {
			if (activityOptionsByCourseId[platformCourseId]) return

			const response = await fetch(
				`/api/public-course-activity-options?platformCourseId=${platformCourseId}`,
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
		[activityOptionsByCourseId],
	)

	useEffect(() => {
		let cancelled = false

		const loadVideos = async () => {
			try {
				const params = new URLSearchParams({
					sort: JSON.stringify(['type', 'ASC']),
					range: JSON.stringify([0, 9999]),
					filter: JSON.stringify({}),
				})
				const response = await fetch(`/api/videos?${params.toString()}`)
				const data = await response.json()

				if (!response.ok) {
					throw new Error(data.error || 'Failed to load videos')
				}

				if (!cancelled) {
					setVideos(data ?? [])
					setVideosLoaded(true)
				}
			} catch (error) {
				if (!cancelled) {
					toast.error(
						error instanceof Error ? error.message : 'Failed to load videos',
					)
					setVideosLoaded(true)
				}
			}
		}

		void loadVideos()

		return () => {
			cancelled = true
		}
	}, [])

	useEffect(() => {
		let cancelled = false

		const loadMusicLibrary = async () => {
			try {
				const response = await fetch('/api/he-music-library')
				const data = await response.json()

				if (!response.ok) {
					throw new Error(data.error || 'Failed to load music library')
				}

				if (!cancelled) {
					setMusicLibrary(data.songs ?? [])
					setMusicLibraryLoaded(true)
				}
			} catch (error) {
				if (!cancelled) {
					toast.error(
						error instanceof Error
							? error.message
							: 'Failed to load music library',
					)
					setMusicLibraryLoaded(true)
				}
			}
		}

		void loadMusicLibrary()

		return () => {
			cancelled = true
		}
	}, [])

	useEffect(() => {
		if (
			!Number.isFinite(parsedCourseId) ||
			!Number.isFinite(parsedPublicCourseLessonId)
		) {
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
				throw new Error(lessonsData.error || 'Failed to load lessons')
			}

			setCourse({
				...courseData.course,
				lessons: lessonsData.lessons ?? [],
			})

			const nextLessons = (lessonsData.lessons ?? []).map(
				mapCuratedLessonToDraftLesson,
			)
			setLessons(nextLessons)

			await Promise.all(
				Array.from(
					new Set(
						nextLessons.map((lesson: DraftLesson) => lesson.platformCourseId),
					),
				).map((platformCourseId) => loadActivityOptions(platformCourseId)),
			)
		}

		void loadPage()
			.catch((error) => {
				toast.error(
					error instanceof Error ? error.message : 'Failed to load lesson',
				)
			})
			.finally(() => setIsLoading(false))
	}, [
		loadActivityOptions,
		navigate,
		parsedCourseId,
		parsedPublicCourseLessonId,
	])

	const updateSelectedLessonActivities = (
		updater: (activities: DraftActivity[]) => DraftActivity[],
	) => {
		setLessons((current) =>
			current.map((lesson, index) =>
				index === selectedLessonIndex
					? { ...lesson, activities: updater(lesson.activities) }
					: lesson,
			),
		)
	}

	const addPartBVideo = () => {
		updateSelectedLessonActivities((activities) =>
			// Keep Part B immediately after Vocabulary when it is added later.
			insertActivity(activities, 'lesson_script_part_b', 'introduction'),
		)
	}

	const addReviewVideo = () => {
		updateSelectedLessonActivities((activities) =>
			// Review should always append to the end of the activity sequence.
			insertActivity(activities, 'lesson_script_review', null),
		)
	}

	const addCustomVideo = () => {
		updateSelectedLessonActivities((activities) =>
			insertActivity(activities, 'lesson_video', 'lesson_script'),
		)
	}

	const addSongActivity = () => {
		updateSelectedLessonActivities((activities) =>
			insertActivity(activities, 'lesson_song', 'lesson_script'),
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
				},
			)
			const lessonsData = await lessonsResponse.json()

			if (!lessonsResponse.ok) {
				throw new Error(lessonsData.error || 'Failed to save lesson activities')
			}

			const nextLessons = (lessonsData.lessons ?? []).map(
				mapCuratedLessonToDraftLesson,
			)
			setLessons(nextLessons)
			const refreshedSelectedLesson = nextLessons.find(
				(lesson) =>
					lesson.platformCourseId === selectedLessonKey.platformCourseId &&
					lesson.lessonId === selectedLessonKey.lessonId,
			)

			if (
				refreshedSelectedLesson?.publicCourseLessonId &&
				refreshedSelectedLesson.publicCourseLessonId !==
					parsedPublicCourseLessonId
			) {
				navigate(
					`/public-courses/${parsedCourseId}/lessons/${refreshedSelectedLesson.publicCourseLessonId}`,
					{ replace: true },
				)
			}

			toast.success('Lesson activities updated.')
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: 'Failed to save lesson activities',
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

	const activityOptions =
		activityOptionsByCourseId[selectedLesson.platformCourseId] ?? null

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
					<Button
						type="button"
						variant="ghost"
						onClick={() => navigate('/public-courses')}
					>
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
								navigate(
									`/public-courses/${parsedCourseId}/lessons/${lesson.publicCourseLessonId}`,
								)
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
								<p className="mt-1 text-sm text-slate-500">
									{lesson.unitTitle}
								</p>
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
						{selectedLesson.lessonScriptPartBId &&
						!selectedLesson.activities.some(
							(activity) => activity.activityKey === 'lesson_script_part_b',
						) ? (
							<div className="rounded-xl border border-dashed border-sky-300 bg-sky-50 p-3 text-sm text-slate-700">
								<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
									<div>
										<p className="font-medium text-slate-900">
											Part B video available
										</p>
										<p className="text-xs text-slate-500">
											Add the second lesson video as its own activity so you can
											place it anywhere in the sequence.
										</p>
									</div>
									<Button type="button" variant="ghost" onClick={addPartBVideo}>
										Add Part B Video
									</Button>
								</div>
							</div>
						) : null}
						{selectedLesson.lessonScriptReviewId &&
						!selectedLesson.activities.some(
							(activity) => activity.activityKey === 'lesson_script_review',
						) ? (
							<div className="rounded-xl border border-dashed border-sky-300 bg-sky-50 p-3 text-sm text-slate-700">
								<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
									<div>
										<p className="font-medium text-slate-900">
											Review video available
										</p>
										<p className="text-xs text-slate-500">
											Add the third lesson video as its own activity so you can
											place it anywhere in the sequence.
										</p>
									</div>
									<Button
										type="button"
										variant="ghost"
										onClick={addReviewVideo}
									>
										Add Review Video
									</Button>
								</div>
							</div>
						) : null}
						{!selectedLesson.activities.some(
							(activity) => activity.activityKey === 'lesson_video',
						) ? (
							<div className="rounded-xl border border-dashed border-sky-300 bg-sky-50 p-3 text-sm text-slate-700">
								<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
									<div>
										<p className="font-medium text-slate-900">
											Custom video available
										</p>
										<p className="text-xs text-slate-500">
											Add an additional video as its own activity and place it
											anywhere in the sequence.
										</p>
									</div>
									<Button type="button" variant="ghost" onClick={addCustomVideo}>
										Add Video Activity
									</Button>
								</div>
							</div>
						) : null}
						{!selectedLesson.activities.some(
							(activity) => activity.activityKey === 'lesson_song',
						) ? (
							<div className="rounded-xl border border-dashed border-sky-300 bg-sky-50 p-3 text-sm text-slate-700">
								<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
									<div>
										<p className="font-medium text-slate-900">Song available</p>
										<p className="text-xs text-slate-500">
											Add a Hebrew music-library song as its own activity so you
											can place it anywhere in the sequence.
										</p>
									</div>
									<Button type="button" variant="ghost" onClick={addSongActivity}>
										Add Song Activity
									</Button>
								</div>
							</div>
						) : null}
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
												: item,
										),
									)
								}
								onMove={(direction) =>
									updateSelectedLessonActivities((activities) =>
										moveActivity(activities, activityIndex, direction),
									)
								}
							>
								{activity.activityKey === 'lesson_script' ? (
									<div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
										<div className="flex flex-wrap items-center justify-between gap-3">
											<div>
												<p className="font-medium text-slate-900">
													Display Video Text
												</p>
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
																	: item,
															),
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
								) : activity.activityKey === 'lesson_script_part_b' ? (
									<div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
										<div className="space-y-3">
											<div>
												<p className="font-medium text-slate-900">
													Part B Video
												</p>
												<p className="text-xs text-slate-500">
													This is the second lesson video and can be ordered
													like any other activity.
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
																	: item,
															),
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
								) : activity.activityKey === 'lesson_script_review' ? (
									<div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
										<div className="space-y-3">
											<div>
												<p className="font-medium text-slate-900">
													Review Video
												</p>
												<p className="text-xs text-slate-500">
													This is the third lesson video and can be ordered like
													any other activity.
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
																	: item,
															),
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
								) : activity.activityKey === 'lesson_video' ? (
									<div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
										<div className="space-y-2">
											<div className="flex flex-wrap items-center justify-between gap-3">
												<div>
													<p className="font-medium text-slate-900">
														Video
													</p>
													<p className="text-xs text-slate-500">
														Pick any video from the library. The menu is
														grouped by type.
													</p>
												</div>
											</div>

											{videosLoaded ? (
												<Select
													value={
														activity.filterConfig.videoId
															? String(activity.filterConfig.videoId)
															: '__none'
													}
													onValueChange={(value) =>
														updateSelectedLessonActivities((activities) =>
															activities.map((item, itemIndex) =>
																itemIndex === activityIndex
																	? {
																			...item,
																			filterConfig: {
																				...item.filterConfig,
																				videoId:
																					value === '__none'
																						? undefined
																						: Number(value),
																			},
																		}
																	: item,
															),
														)
													}
												>
													<SelectTrigger>
														<SelectValue placeholder="No video selected" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="__none">No video</SelectItem>
														{Object.entries(videosByType).map(
															([type, typeVideos]) => (
																<SelectGroup key={type}>
																	<SelectLabel>
																		{VIDEO_TYPE_LABELS[type] ?? type}
																	</SelectLabel>
																	{typeVideos.map((video) => {
																		const label =
																			video.title ||
																			video.hebTitle ||
																			video.titleTransliteration ||
																			`Video ${video.id}`

																		return (
																			<SelectItem
																				key={video.id}
																				value={String(video.id)}
																			>
																				{label}
																			</SelectItem>
																		)
																	})}
																</SelectGroup>
															),
														)}
													</SelectContent>
												</Select>
											) : (
												<p className="text-xs text-slate-500">
													Loading videos...
												</p>
											)}
										</div>

										<div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3">
											<div>
												<p className="font-medium text-slate-900">
													Display Video Text
												</p>
												<p className="text-xs text-slate-500">
													This controls whether scheduled learners see the
													video transcript on the lesson page.
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
																	: item,
															),
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
								) : activity.activityKey === 'lesson_song' ? (
									<div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
										<div className="space-y-2">
											<div className="flex flex-wrap items-center justify-between gap-3">
												<div>
													<p className="font-medium text-slate-900">
														Song
													</p>
													<p className="text-xs text-slate-500">
														Pick any Hebrew music-library song. The menu is
														grouped by category.
													</p>
												</div>
											</div>

											{musicLibraryLoaded ? (
												<Select
													value={
														activity.filterConfig.musicId
															? String(activity.filterConfig.musicId)
															: '__none'
													}
													onValueChange={(value) =>
														updateSelectedLessonActivities((activities) =>
															activities.map((item, itemIndex) =>
																itemIndex === activityIndex
																	? {
																			...item,
																			filterConfig: {
																				...item.filterConfig,
																				musicId:
																					value === '__none'
																						? undefined
																						: Number(value),
																			},
																		}
																	: item,
															),
														)
													}
												>
													<SelectTrigger>
														<SelectValue placeholder="No song selected" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="__none">No song</SelectItem>
														{Object.entries(musicByCategory).map(
															([category, songs]) => (
																<SelectGroup key={category}>
																	<SelectLabel>{category}</SelectLabel>
																	{songs.map((song) => {
																		return (
																			<SelectItem
																				key={song.id}
																				value={String(song.id)}
																			>
																				<div className="flex flex-col">
																					<span>{song.title}</span>
																					{song.titleTransliteration ? (
																						<span className="text-xs text-slate-500">
																							{song.titleTransliteration}
																						</span>
																					) : null}
																				</div>
																			</SelectItem>
																		)
																	})}
																</SelectGroup>
															),
														)}
													</SelectContent>
												</Select>
											) : (
												<p className="text-xs text-slate-500">
													Loading music library...
												</p>
											)}
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
													: item,
											),
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
									`/public-courses/${parsedCourseId}/lessons/${previousLesson.publicCourseLessonId}`,
								)
							}}
						>
							Previous Lesson
						</Button>
						<Button
							type="button"
							variant="ghost"
							disabled={
								selectedLessonIndex < 0 ||
								selectedLessonIndex >= lessons.length - 1
							}
							onClick={() => {
								const nextLesson = lessons[selectedLessonIndex + 1]
								if (!nextLesson?.publicCourseLessonId) return
								navigate(
									`/public-courses/${parsedCourseId}/lessons/${nextLesson.publicCourseLessonId}`,
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
