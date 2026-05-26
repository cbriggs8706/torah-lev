const STUDY_GROUP_SCHEDULE_META_PREFIX = '__study_group_meta__:'

type StudyGroupScheduleMetaInput = {
	studyGroupCourseId: number | null
	groupCourseName: string | null
	title: string | null
	userNotes: string | null
	platformCourseId: number | null
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

		return {
			meta,
			userNotes: meta.userNotes ?? null,
		}
	} catch {
		return {
			meta: null,
			userNotes: rawNotes ?? null,
		}
	}
}
