'use client'

import { Checkbox } from '@/components/ui/checkbox'
import {
	applyDefaultPublicCourseActivityFilters,
	getDefaultPublicCourseLessonActivities,
	getPublicCourseActivityDefinition,
	type PublicCourseActivityFilters,
	type PublicCourseActivityKey,
} from '@/lib/public-course-activities'

export type PlatformCourse = {
	id: number
	title: string
}

export type LessonOption = {
	id: number
	title: string
	lessonNumber?: string | number
	unitTitle?: string
	unitOrder?: number
}

export type ActivityRecord = {
	id: number
	activityKey: PublicCourseActivityKey
	order: number
	isEnabled: boolean
	filterConfig: PublicCourseActivityFilters
}

export type CuratedLesson = {
	id: number
	order: number
	platformCourseId: number
	platformCourse: {
		id: number
		title: string
	}
	lesson: {
		id: number
		title: string
		lessonNumber: string | null
		unit: {
			title: string | null
			order: number | null
	} | null
	}
	activities: ActivityRecord[]
	lessonScriptId?: number | null
	lessonScriptPartBId?: number | null
	lessonScriptReviewId?: number | null
}

export type PublicCourseRecord = {
	id: number
	order: number
	name: string
	description: string | null
	imageUrl: string
	curriculumId: number | null
	curriculum: {
		id: number
		title: string
	} | null
	proficiencyLevel: string | null
	endingProficiencyLevel: string | null
	lessons: CuratedLesson[]
}

export type DraftActivity = {
	activityKey: PublicCourseActivityKey
	isEnabled: boolean
	filterConfig: PublicCourseActivityFilters
}

export type DraftLesson = {
	publicCourseLessonId?: number
	platformCourseId: number
	platformCourseTitle: string
	lessonId: number
	lessonTitle: string
	lessonNumber: string | number | null
	unitTitle: string | null
	lessonScriptId?: number | null
	lessonScriptPartBId?: number | null
	lessonScriptReviewId?: number | null
	activities: DraftActivity[]
}

export type ActivityFilterOptions = {
	lessonOptions: string[]
	typeOptions: Array<'all' | 'word' | 'phrase' | 'stack'>
	formatOptions: Array<'image' | 'audio' | 'translation' | 'letter-by-letter'>
	hebrewFieldOptions: Array<'heb' | 'hebNiqqud'>
}

export function formatLessonLabel(
	lesson: Pick<DraftLesson, 'lessonNumber' | 'lessonTitle'>
) {
	return lesson.lessonNumber
		? `Lesson ${lesson.lessonNumber}: ${lesson.lessonTitle}`
		: lesson.lessonTitle
}

export function getAssignedActivitySummary(activities: DraftActivity[]) {
	return activities.filter(
		(activity) => activity.activityKey === 'lesson_script' || activity.isEnabled
	)
}

export function normalizeDraftActivities(
	activities: DraftActivity[],
	lessonNumber?: string | number | null
) {
	const byKey = new Map(activities.map((activity) => [activity.activityKey, activity]))
	return getDefaultPublicCourseLessonActivities().map((defaultActivity) => {
		const existing = byKey.get(defaultActivity.activityKey)
		return {
			activityKey: defaultActivity.activityKey,
			isEnabled:
				defaultActivity.activityKey === 'lesson_script'
					? true
					: existing?.isEnabled ?? defaultActivity.isEnabled,
			filterConfig: applyDefaultPublicCourseActivityFilters({
				filters: existing?.filterConfig ?? defaultActivity.filterConfig,
				activityKey: defaultActivity.activityKey,
				lessonNumber,
			}),
		}
	})
}

function mapActivitiesToDraftActivities(activities: ActivityRecord[]) {
	const sorted = activities.slice().sort((a, b) => a.order - b.order)

	if (sorted.length === 0) {
		return getDefaultPublicCourseLessonActivities().map((activity) => ({
			activityKey: activity.activityKey,
			isEnabled: activity.isEnabled,
			filterConfig: activity.filterConfig,
		}))
	}

	return sorted.map((activity) => ({
		activityKey: activity.activityKey,
		isEnabled: activity.isEnabled,
		filterConfig: activity.filterConfig,
	}))
}

function applyLessonNumberDefaultsToActivity(
	activity: DraftActivity,
	lessonNumber: string | number | null | undefined
) {
	return {
		...activity,
		filterConfig: applyDefaultPublicCourseActivityFilters({
			filters: activity.filterConfig,
			activityKey: activity.activityKey,
			lessonNumber,
		}),
	}
}

export function mapCuratedLessonToDraftLesson(lesson: CuratedLesson): DraftLesson {
	const lessonNumber = lesson.lesson.lessonNumber
	return {
		publicCourseLessonId: lesson.id,
		platformCourseId: lesson.platformCourseId,
		platformCourseTitle: lesson.platformCourse.title,
		lessonId: lesson.lesson.id,
		lessonTitle: lesson.lesson.title,
		lessonNumber: lesson.lesson.lessonNumber,
		unitTitle: lesson.lesson.unit?.title ?? null,
		lessonScriptId: lesson.lessonScriptId ?? null,
		lessonScriptPartBId: lesson.lessonScriptPartBId ?? null,
		lessonScriptReviewId: lesson.lessonScriptReviewId ?? null,
		activities: mapActivitiesToDraftActivities(lesson.activities ?? []).map((activity) =>
			applyLessonNumberDefaultsToActivity(activity, lessonNumber)
		),
	}
}

export function ActivityFilterEditor({
	activity,
	options,
	onChange,
}: {
	activity: DraftActivity
	options: ActivityFilterOptions | null
	onChange: (next: PublicCourseActivityFilters) => void
}) {
	const definition = getPublicCourseActivityDefinition(activity.activityKey)

	if (!definition || definition.filterKeys.length === 0) {
		return <p className="text-xs text-slate-500">No extra filters for this activity.</p>
	}

	if (!options) {
		return <p className="text-xs text-slate-500">Loading filter options...</p>
	}

	return (
		<div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
			{definition.filterKeys.includes('selectedLessons') ? (
				<div className="space-y-2">
					<p className="text-sm font-medium text-slate-900">Lessons</p>
					<div className="flex flex-wrap gap-2">
						{options.lessonOptions.map((lesson) => {
							const selected = activity.filterConfig.selectedLessons ?? []
							const active = selected.includes(lesson)
							return (
								<button
									key={lesson}
									type="button"
									onClick={() => {
										const next = active
											? selected.filter((item) => item !== lesson)
											: [...selected, lesson]
										onChange({ ...activity.filterConfig, selectedLessons: next })
									}}
									className={`rounded-full border px-3 py-1 text-xs ${
										active
											? 'border-sky-600 bg-sky-600 text-white'
											: 'border-slate-300 bg-white text-slate-700'
									}`}
								>
									{lesson}
								</button>
							)
						})}
					</div>
				</div>
			) : null}

			{definition.filterKeys.includes('selectedType') ? (
				<div className="space-y-2">
					<p className="text-sm font-medium text-slate-900">Type</p>
					<div className="flex flex-wrap gap-2">
						{options.typeOptions.map((type) => {
							const active =
								(activity.filterConfig.selectedType ?? 'all') === type
							return (
								<button
									key={type}
									type="button"
									onClick={() =>
										onChange({
											...activity.filterConfig,
											selectedType: type,
										})
									}
									className={`rounded-full border px-3 py-1 text-xs ${
										active
											? 'border-sky-600 bg-sky-600 text-white'
											: 'border-slate-300 bg-white text-slate-700'
									}`}
								>
									{type}
								</button>
							)
						})}
					</div>
				</div>
			) : null}

			{definition.filterKeys.includes('formatType') ? (
				<div className="space-y-2">
					<p className="text-sm font-medium text-slate-900">Prompt Type</p>
					<div className="flex flex-wrap gap-2">
						{options.formatOptions.map((type) => {
							const active = activity.filterConfig.formatType === type
							return (
								<button
									key={type}
									type="button"
									onClick={() =>
										onChange({
											...activity.filterConfig,
											formatType: type,
										})
									}
									className={`rounded-full border px-3 py-1 text-xs ${
										active
											? 'border-sky-600 bg-sky-600 text-white'
											: 'border-slate-300 bg-white text-slate-700'
									}`}
								>
									{type}
								</button>
							)
						})}
					</div>
				</div>
			) : null}

			{definition.filterKeys.includes('hebrewField') ? (
				<div className="space-y-2">
					<p className="text-sm font-medium text-slate-900">Niqqud</p>
					<div className="flex flex-wrap gap-2">
						{options.hebrewFieldOptions.map((field) => {
							const active = activity.filterConfig.hebrewField === field
							return (
								<button
									key={field}
									type="button"
									onClick={() =>
										onChange({
											...activity.filterConfig,
											hebrewField: field,
										})
									}
									className={`rounded-full border px-3 py-1 text-xs ${
										active
											? 'border-sky-600 bg-sky-600 text-white'
											: 'border-slate-300 bg-white text-slate-700'
									}`}
								>
									{field === 'heb' ? 'Without niqqud' : 'With niqqud'}
								</button>
							)
						})}
					</div>
				</div>
			) : null}
		</div>
	)
}

export function ActivityToggleRow({
	activity,
	activityIndex,
	totalActivities,
	onEnabledChange,
	onMove,
	children,
}: {
	activity: DraftActivity
	activityIndex: number
	totalActivities: number
	onEnabledChange: (checked: boolean) => void
	onMove: (direction: -1 | 1) => void
	children: React.ReactNode
}) {
	const definition = getPublicCourseActivityDefinition(activity.activityKey)
	if (!definition) return null
	const description =
		activity.activityKey === 'lesson_script'
			? 'This stays first and unlocks the rest of the lesson.'
			: activity.activityKey === 'lesson_script_part_b'
				? 'This is the second lesson video and can be moved anywhere in the sequence.'
			: activity.activityKey === 'lesson_script_review'
				? 'This is the third lesson video and can be moved anywhere in the sequence.'
			: activity.activityKey === 'lesson_video'
				? 'Add an extra video activity and move it anywhere in the sequence.'
			: activity.activityKey === 'lesson_song'
				? 'Add a Hebrew song and move it anywhere in the sequence.'
				: 'Configure whether this activity appears and which filters it uses.'

	return (
		<div className="rounded-xl border border-slate-200 p-4 space-y-3">
			<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
				<div>
					<p className="font-semibold text-slate-900">{definition.label}</p>
					<p className="text-xs text-slate-500">{description}</p>
				</div>

				<div className="flex flex-wrap items-center gap-4">
					<div className="flex items-center gap-2">
						<Checkbox
							checked={activity.isEnabled}
							disabled={activity.activityKey === 'lesson_script'}
							onCheckedChange={(checked) => onEnabledChange(Boolean(checked))}
						/>
						<span className="text-sm text-slate-700">Enabled</span>
					</div>
					<button
						type="button"
						className="text-sm font-medium text-slate-500 disabled:text-slate-300"
						disabled={activityIndex <= 1}
						onClick={() => onMove(-1)}
					>
						Left
					</button>
					<button
						type="button"
						className="text-sm font-medium text-slate-500 disabled:text-slate-300"
						disabled={activityIndex === 0 || activityIndex === totalActivities - 1}
						onClick={() => onMove(1)}
					>
						Right
					</button>
				</div>
			</div>

			{children}
		</div>
	)
}
