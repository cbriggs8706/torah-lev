'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import {
	ActivityFilterEditor,
	ActivityToggleRow,
	type ActivityFilterOptions,
	type DraftActivity,
	type DraftLesson,
	formatLessonLabel,
	normalizeDraftActivities,
} from '@/app/admin/public-courses/shared'
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
import { cn } from '@/lib/utils'
import type { StudyGroupScheduleActivity } from '@/lib/study-group-schedule-meta'

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

type MusicOption = {
	id: number
	title: string
	hebTitle: string | null
	titleTransliteration: string | null
	category: string | null
	order: number
}

type StudyGroupScheduleEvent = {
	id: number
	classDate: string | Date
	title: string | null
	notes?: string | null
	studyGroupCourseId: number | null
	groupCourseName: string | null
	platformCourseId: number | null
	platformCourseTitle: string | null
	lessonId: number | null
	lessonTitle: string | null
	lessonNumber: string | null
	lessonScriptId: number | null
	lessonScriptPartBId: number | null
	lessonScriptReviewId: number | null
	activities?: StudyGroupScheduleActivity[] | null
}

type LessonOption = {
	id: number
	title: string
	lessonNumber?: string | number
	unitTitle?: string
	unitOrder?: number
}

type StudyGroupScheduleCurationProps = {
	studyGroupId: number
	initialEvents: StudyGroupScheduleEvent[]
	videoOptions?: VideoOption[]
	musicLibrary?: MusicOption[]
	onEventUpdated?: (event: StudyGroupScheduleEvent) => void
}

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
	;[next[activityIndex], next[nextIndex]] = [next[nextIndex], next[activityIndex]]
	return next
}

function insertActivity(
	activities: DraftActivity[],
	activityKey: DraftActivity['activityKey'],
	insertAfterKey: DraftActivity['activityKey'] | null = 'lesson_script',
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

function formatDateTime(value: string | Date) {
	const parsed = value instanceof Date ? value : new Date(value)
	if (Number.isNaN(parsed.getTime())) return 'Invalid date'

	return parsed.toLocaleString(undefined, {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
	})
}

function groupVideosByType(videos: VideoOption[]) {
	return videos
		.slice()
		.sort((a, b) => {
			const typeCompare = (a.type ?? '').localeCompare(b.type ?? '')
			if (typeCompare !== 0) return typeCompare
			const titleA = a.title || a.hebTitle || a.titleTransliteration || `Video ${a.id}`
			const titleB = b.title || b.hebTitle || b.titleTransliteration || `Video ${b.id}`
			return titleA.localeCompare(titleB)
		})
		.reduce<Record<string, VideoOption[]>>((groups, video) => {
			const typeKey = video.type || 'other'
			const list = groups[typeKey] ?? []
			list.push(video)
			groups[typeKey] = list
			return groups
		}, {})
}

function normalizeMusicCategory(category: string | null) {
	return (category?.trim() || 'Uncategorized').trim()
}

function groupMusicByCategory(musicLibrary: MusicOption[]) {
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
}

function buildDraftFromEvent(event: StudyGroupScheduleEvent): DraftLesson {
	return {
		publicCourseLessonId: event.id,
		platformCourseId: event.platformCourseId ?? 0,
		platformCourseTitle: event.platformCourseTitle ?? 'Study group course',
		lessonId: event.lessonId ?? 0,
		lessonTitle: event.lessonTitle ?? event.title ?? 'Untitled lesson',
		lessonNumber: event.lessonNumber ?? null,
		unitTitle: null,
		lessonScriptId: event.lessonScriptId ?? null,
		lessonScriptPartBId: event.lessonScriptPartBId ?? null,
		lessonScriptReviewId: event.lessonScriptReviewId ?? null,
		activities: normalizeDraftActivities(
			(event.activities ?? []).map((activity) => ({
				activityKey: activity.activityKey as DraftActivity['activityKey'],
				isEnabled: activity.isEnabled,
				filterConfig: activity.filterConfig as DraftActivity['filterConfig'],
			})),
			event.lessonNumber ?? null,
		),
	}
}

export default function StudyGroupScheduleCuration({
	studyGroupId,
	initialEvents,
	videoOptions: initialVideoOptions,
	musicLibrary: initialMusicLibrary,
	onEventUpdated,
}: StudyGroupScheduleCurationProps) {
	const lessonEvents = useMemo(
		() =>
			initialEvents.filter(
				(event) =>
					event.lessonId != null &&
					event.platformCourseId != null &&
					event.lessonNumber != null,
			),
		[initialEvents],
	)
	const [events, setEvents] = useState(lessonEvents)
	const [selectedEventId, setSelectedEventId] = useState<number | null>(
		lessonEvents[0]?.id ?? null,
	)
	const [lessons, setLessons] = useState<DraftLesson[]>(
		lessonEvents.map(buildDraftFromEvent),
	)
	const [lessonOptions, setLessonOptions] = useState<string[]>([])
	const [videoOptions, setVideoOptions] = useState<VideoOption[]>(
		initialVideoOptions ?? [],
	)
	const [musicLibrary, setMusicLibrary] = useState<MusicOption[]>(
		initialMusicLibrary ?? [],
	)
	const [isSaving, setIsSaving] = useState(false)

	const selectedLessonIndex = useMemo(
		() => lessons.findIndex((lesson) => lesson.publicCourseLessonId === selectedEventId),
		[lessons, selectedEventId],
	)
	const selectedLesson =
		selectedLessonIndex >= 0 ? (lessons[selectedLessonIndex] ?? null) : null
	const selectedEvent = events.find((event) => event.id === selectedEventId) ?? null
	const videosByType = useMemo(() => groupVideosByType(videoOptions), [videoOptions])
	const musicByCategory = useMemo(
		() => groupMusicByCategory(musicLibrary),
		[musicLibrary],
	)

	useEffect(() => {
		setEvents(lessonEvents)
		setLessons(lessonEvents.map(buildDraftFromEvent))
		setSelectedEventId((current) => {
			if (current != null && lessonEvents.some((event) => event.id === current)) {
				return current
			}
			return lessonEvents[0]?.id ?? null
		})
	}, [lessonEvents])

	useEffect(() => {
		if (initialVideoOptions) {
			setVideoOptions(initialVideoOptions)
		}
	}, [initialVideoOptions])

	useEffect(() => {
		if (initialMusicLibrary) {
			setMusicLibrary(initialMusicLibrary)
		}
	}, [initialMusicLibrary])

	useEffect(() => {
		if (initialVideoOptions || initialMusicLibrary) {
			return
		}

		let cancelled = false

		const loadPickerData = async () => {
			try {
				const response = await fetch(
					`/api/study-groups/${studyGroupId}/schedule/options`,
				)
				const data = await response.json()

				if (!response.ok) {
					throw new Error(data.error || 'Failed to load activity options')
				}

				if (cancelled) return

				setVideoOptions(Array.isArray(data.videoOptions) ? data.videoOptions : [])
				setMusicLibrary(
					Array.isArray(data.musicLibrary) ? data.musicLibrary : [],
				)
			} catch (error) {
				if (!cancelled) {
					toast.error(
						error instanceof Error
							? error.message
							: 'Could not load activity options.',
					)
				}
			}
		}

		void loadPickerData()

		return () => {
			cancelled = true
		}
	}, [initialMusicLibrary, initialVideoOptions, studyGroupId])

	useEffect(() => {
		const loadLessonOptions = async () => {
			if (!selectedEvent?.platformCourseId) {
				setLessonOptions([])
				return
			}

			try {
				const response = await fetch(
					`/api/public/curriculum/${selectedEvent.platformCourseId}/lessons`,
				)
				const data = await response.json()

				if (!response.ok) {
					throw new Error(data.error || 'Failed to load lesson options')
				}

				const lessonRows = Array.isArray(data?.lessons) ? data.lessons : []
				setLessonOptions(
					lessonRows
						.map((lesson: LessonOption) => lesson.lessonNumber?.toString() ?? '')
						.filter(Boolean),
				)
			} catch (error) {
				setLessonOptions([])
				toast.error(
					error instanceof Error ? error.message : 'Could not load lessons.',
				)
			}
		}

		void loadLessonOptions()
	}, [selectedEvent?.platformCourseId])

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

	const handleSave = async () => {
		if (!selectedEvent || !selectedLesson) return

		setIsSaving(true)

		try {
			const response = await fetch(
				`/api/study-groups/${studyGroupId}/schedule/${selectedEvent.id}`,
				{
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						activities: selectedLesson.activities.map((activity, index) => ({
							activityKey: activity.activityKey,
							order: index + 1,
							isEnabled:
								activity.activityKey === 'lesson_script'
									? true
									: activity.isEnabled,
							filterConfig: activity.filterConfig,
						})),
					}),
				},
			)
			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.error || 'Failed to save lesson curation')
			}

			const updatedEvent = data.event as StudyGroupScheduleEvent | undefined
			if (updatedEvent) {
				setEvents((current) =>
					current.map((event) =>
						event.id === updatedEvent.id ? updatedEvent : event,
					),
				)
				onEventUpdated?.(updatedEvent)
			}

			toast.success('Lesson curation updated.')
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Failed to save lesson curation',
			)
		} finally {
			setIsSaving(false)
		}
	}

	const selectedActivityOptions = lessonOptions

	return (
		<div className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
			<div className="space-y-1">
				<h2 className="text-xl font-semibold text-slate-900">
					Lesson Curation
				</h2>
				<p className="text-sm text-slate-600">
					Curate the lesson activities for each scheduled class using the same
					controls as the public course editor.
				</p>
			</div>

			{events.length > 0 ? (
				<div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
					<div className="space-y-3">
						<h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-700">
							Scheduled Lessons
						</h3>
						{events.map((event, index) => (
							<button
								key={event.id}
								type="button"
								onClick={() => setSelectedEventId(event.id)}
								className={cn(
									'w-full rounded-2xl border p-4 text-left transition',
									selectedEventId === event.id
										? 'border-sky-300 bg-sky-50'
										: 'border-slate-200 bg-slate-50 hover:bg-slate-100',
								)}
							>
								<p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
									{index + 1}. {event.platformCourseTitle}
								</p>
								<p className="mt-1 font-semibold text-slate-900">
									{event.lessonNumber
										? `Lesson ${event.lessonNumber}: ${event.lessonTitle}`
										: event.title || 'Untitled lesson'}
								</p>
								{event.groupCourseName ? (
									<p className="mt-1 text-sm text-slate-500">
										{event.groupCourseName}
									</p>
								) : null}
							</button>
						))}
					</div>

					<div className="space-y-4">
						{selectedEvent && selectedLesson ? (
							<>
								<div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
									<p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
										{selectedEvent.platformCourseTitle}
									</p>
									<p className="mt-1 text-sm text-slate-600">
										{formatDateTime(selectedEvent.classDate)}
									</p>
									<p className="mt-2 text-lg font-semibold text-slate-900">
										{formatLessonLabel(selectedLesson)}
									</p>
									<p className="mt-1 text-sm text-slate-600">
										{selectedEvent.groupCourseName ?? 'Study group lesson'}
									</p>
								</div>

								<div className="space-y-3">
									<h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-700">
										Activities
									</h3>

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
														Add the second lesson video as its own activity so you
														can place it anywhere in the sequence.
													</p>
												</div>
												<Button
													type="button"
													variant="ghost"
													onClick={() =>
														updateSelectedLessonActivities((activities) =>
															insertActivity(activities, 'lesson_script_part_b', 'introduction'),
														)
													}
												>
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
														Add the third lesson video as its own activity so you
														can place it anywhere in the sequence.
													</p>
												</div>
												<Button
													type="button"
													variant="ghost"
													onClick={() =>
														updateSelectedLessonActivities((activities) =>
															insertActivity(activities, 'lesson_script_review', null),
														)
													}
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
														Add an additional video as its own activity and place
														it anywhere in the sequence.
													</p>
												</div>
												<Button
													type="button"
													variant="ghost"
													onClick={() =>
														updateSelectedLessonActivities((activities) =>
															insertActivity(activities, 'lesson_video', 'lesson_script'),
														)
													}
												>
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
														Add a Hebrew music-library song as its own activity so
														you can place it anywhere in the sequence.
													</p>
												</div>
												<Button
													type="button"
													variant="ghost"
													onClick={() =>
														updateSelectedLessonActivities((activities) =>
															insertActivity(activities, 'lesson_song', 'lesson_script'),
														)
													}
												>
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
																Only affects scheduled learners.
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
																This is the third lesson video and can be ordered
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
											) : activity.activityKey === 'lesson_video' ? (
												<div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
													<div className="space-y-2">
														<div className="flex flex-wrap items-center justify-between gap-3">
															<div>
																<p className="font-medium text-slate-900">Video</p>
																<p className="text-xs text-slate-500">
																	Pick any video from the library. The menu is grouped
																	by type.
																</p>
															</div>
														</div>

														<Select
															value={
																typeof activity.filterConfig.videoId === 'number'
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
																			<SelectLabel>{type}</SelectLabel>
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
													</div>

													<div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3">
														<div>
															<p className="font-medium text-slate-900">
																Display Video Text
															</p>
															<p className="text-xs text-slate-500">
																This controls whether scheduled learners see the video
																transcript on the lesson page.
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
																<p className="font-medium text-slate-900">Song</p>
																<p className="text-xs text-slate-500">
																	Pick any Hebrew music-library song. The menu is
																	grouped by category.
																</p>
															</div>
														</div>

														<Select
															value={
																typeof activity.filterConfig.musicId === 'number'
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
																			{songs.map((song) => (
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
																			))}
																		</SelectGroup>
																	),
																)}
															</SelectContent>
														</Select>
													</div>
												</div>
											) : null}

											<ActivityFilterEditor
												activity={activity}
												options={
													{
														lessonOptions: selectedActivityOptions,
														typeOptions: ['all', 'word', 'phrase', 'stack'],
														formatOptions: [
															'image',
															'audio',
															'translation',
															'letter-by-letter',
														],
														hebrewFieldOptions: ['heb', 'hebNiqqud'],
													} as ActivityFilterOptions
												}
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

								<div className="flex justify-end">
									<Button type="button" onClick={handleSave} disabled={isSaving}>
										{isSaving ? 'Saving...' : 'Save Lesson'}
									</Button>
								</div>
							</>
						) : (
							<div className="rounded-2xl border border-dashed p-6 text-sm text-slate-600">
								Choose a scheduled lesson to begin curation.
							</div>
						)}
					</div>
				</div>
			) : (
				<div className="rounded-2xl border border-dashed p-6 text-sm text-slate-600">
					No lesson-based scheduled classes have been added yet.
				</div>
			)}
		</div>
	)
}
