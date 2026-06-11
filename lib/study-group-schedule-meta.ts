const STUDY_GROUP_SCHEDULE_META_PREFIX = '__study_group_meta__:'

export type StudyGroupScheduleActivity = {
	activityKey: string
	order: number
	isEnabled: boolean
	filterConfig: Record<string, unknown>
}

type StudyGroupScheduleMetaInput = {
	studyGroupCourseId: number | null
	groupCourseName: string | null
	title: string | null
	userNotes: string | null
	platformCourseId: number | null
	activities?: StudyGroupScheduleActivity[]
}

export type ParsedStudyGroupScheduleMeta = StudyGroupScheduleMetaInput

export function serializeStudyGroupScheduleMeta(
	input: StudyGroupScheduleMetaInput
) {
	return `${STUDY_GROUP_SCHEDULE_META_PREFIX}${JSON.stringify(input)}`
}

export function parseStudyGroupScheduleMeta(rawNotes: string | null | undefined) {
	if (!rawNotes?.startsWith(STUDY_GROUP_SCHEDULE_META_PREFIX)) {
		return {
			meta: null,
			userNotes: rawNotes ?? null,
		}
	}

	try {
		const meta = JSON.parse(
			rawNotes.slice(STUDY_GROUP_SCHEDULE_META_PREFIX.length)
		) as ParsedStudyGroupScheduleMeta

		const activities = Array.isArray(meta.activities)
			? meta.activities
					.filter((activity): activity is StudyGroupScheduleActivity => {
						return Boolean(
							activity &&
								typeof activity.activityKey === 'string' &&
								typeof activity.order === 'number' &&
								typeof activity.isEnabled === 'boolean' &&
								activity.filterConfig &&
								typeof activity.filterConfig === 'object' &&
								!Array.isArray(activity.filterConfig),
						)
					})
			: undefined

		return {
			meta: {
				...meta,
				activities,
			},
			userNotes: meta.userNotes ?? null,
		}
	} catch {
		return {
			meta: null,
			userNotes: rawNotes ?? null,
		}
	}
}
