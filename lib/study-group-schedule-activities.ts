import {
	applyDefaultPublicCourseActivityFilters,
	getDefaultPublicCourseLessonActivities,
	getPublicCourseActivityDefinition,
	getPublicCourseActivityVideoId,
	normalizePublicCourseActivityFilters,
	type PublicCourseActivityFilters,
	type PublicCourseActivityKey,
} from '@/lib/public-course-activities'
import { encodePublicCourseFilters } from '@/lib/public-course-activities'
import type { StudyGroupScheduleActivity } from '@/lib/study-group-schedule-meta'

export type StudyGroupScheduledActivityLink = {
	key: PublicCourseActivityKey
	label: string
	href: string
	iconSrc: string
}

export function normalizeStudyGroupScheduleActivities(
	activities: StudyGroupScheduleActivity[] | null | undefined,
	lessonNumber: string | number | null | undefined,
) {
	const byKey = new Map((activities ?? []).map((activity) => [activity.activityKey, activity]))

	return getDefaultPublicCourseLessonActivities().map((defaultActivity) => {
		const existing = byKey.get(defaultActivity.activityKey)
		return {
			activityKey: defaultActivity.activityKey,
			order: existing?.order ?? defaultActivity.order,
			isEnabled:
				defaultActivity.activityKey === 'lesson_script'
					? true
					: existing?.isEnabled ?? defaultActivity.isEnabled,
			filterConfig: applyDefaultPublicCourseActivityFilters({
				filters: normalizePublicCourseActivityFilters(
					existing?.filterConfig ?? defaultActivity.filterConfig,
				),
				activityKey: defaultActivity.activityKey,
				lessonNumber,
			}),
		}
	})
}

function buildStudyGroupActivityQuery({
	courseId,
	lessonNumber,
	studyGroupId,
	activityKey,
	filterConfig,
}: {
	courseId: number
	lessonNumber: string
	studyGroupId: number
	activityKey: PublicCourseActivityKey
	filterConfig: PublicCourseActivityFilters
}) {
	const params = new URLSearchParams({
		scheduled: '1',
		courseId: String(courseId),
		lesson: lessonNumber,
		studyGroupId: String(studyGroupId),
		publicCourseActivityKey: activityKey,
	})

	const normalizedFilters = normalizePublicCourseActivityFilters(filterConfig)
	if (Object.keys(normalizedFilters).length > 0) {
		params.set('publicCourseFilters', encodePublicCourseFilters(normalizedFilters))
	}

	params.set('returnTo', `/study-group/${studyGroupId}`)
	return params.toString()
}

export function buildStudyGroupScheduledActivityLinks({
	courseId,
	lessonNumber,
	studyGroupId,
	lessonScriptId,
	lessonScriptPartBId,
	lessonScriptReviewId,
	activities,
}: {
	courseId: number | null
	lessonNumber: string | null
	studyGroupId: number
	lessonScriptId: number | null
	lessonScriptPartBId: number | null
	lessonScriptReviewId: number | null
	activities: StudyGroupScheduleActivity[] | null | undefined
}): StudyGroupScheduledActivityLink[] {
	if (!courseId || !lessonNumber) return []

	const normalizedActivities = normalizeStudyGroupScheduleActivities(
		activities,
		lessonNumber,
	)

	return normalizedActivities
		.filter((activity) => activity.isEnabled)
		.map((activity) => {
			const definition = getPublicCourseActivityDefinition(activity.activityKey)
			if (!definition) return null

			const videoId = getPublicCourseActivityVideoId({
				activityKey: activity.activityKey,
				filterConfig: activity.filterConfig,
				lessonScriptId,
				lessonScriptPartBId,
				lessonScriptReviewId,
			})

			const href =
				activity.activityKey === 'lesson_song'
					? videoId
						? `/he/music/${videoId}?${buildStudyGroupActivityQuery({
								courseId,
								lessonNumber,
								studyGroupId,
								activityKey: activity.activityKey,
								filterConfig: activity.filterConfig,
						  })}`
						: null
					: activity.activityKey === 'lesson_script' ||
						  activity.activityKey === 'lesson_script_part_b' ||
						  activity.activityKey === 'lesson_script_review' ||
						  activity.activityKey === 'lesson_video'
						? videoId
							? `/he/videos/${videoId}?${buildStudyGroupActivityQuery({
									courseId,
									lessonNumber,
									studyGroupId,
									activityKey: activity.activityKey,
									filterConfig: activity.filterConfig,
							  })}`
							: null
						: activity.activityKey === 'opposites'
							? `${definition.href}?${buildStudyGroupActivityQuery({
									courseId,
									lessonNumber,
									studyGroupId,
									activityKey: activity.activityKey,
									filterConfig: activity.filterConfig,
							  })}`
						: definition.href
							? `${definition.href}?${buildStudyGroupActivityQuery({
									courseId,
									lessonNumber,
									studyGroupId,
									activityKey: activity.activityKey,
									filterConfig: activity.filterConfig,
							  })}`
							: null

			if (!href) return null

			return {
				key: activity.activityKey,
				label: definition.label,
				iconSrc: definition.iconSrc,
				href,
			}
		})
		.filter(
			(activity): activity is StudyGroupScheduledActivityLink => Boolean(activity),
		)
}
