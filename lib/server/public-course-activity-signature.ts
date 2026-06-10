import 'server-only'

import { createHash } from 'node:crypto'

import {
	applyDefaultPublicCourseActivityFilters,
	getPublicCourseActivityDefinition,
	getPublicCourseActivityVideoId,
	normalizePublicCourseActivityFilters,
	type PublicCourseActivityFilters,
	type PublicCourseActivityKey,
} from '@/lib/public-course-activities'

function stableStringify(value: unknown): string {
	if (value === null || typeof value !== 'object') {
		return JSON.stringify(value)
	}

	if (Array.isArray(value)) {
		return `[${value.map((item) => stableStringify(item)).join(',')}]`
	}

	const entries = Object.entries(value as Record<string, unknown>)
		.filter(([, entryValue]) => entryValue !== undefined)
		.sort(([left], [right]) => left.localeCompare(right))
		.map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`)

	return `{${entries.join(',')}}`
}

function hashSignature(value: unknown) {
	return createHash('sha256').update(stableStringify(value)).digest('hex')
}

function getNormalizedFilterSignature({
	activityKey,
	filterConfig,
	lessonNumber,
}: {
	activityKey: PublicCourseActivityKey
	filterConfig: PublicCourseActivityFilters
	lessonNumber: string | number | null | undefined
}) {
	const definition = getPublicCourseActivityDefinition(activityKey)
	const normalizedFilters = normalizePublicCourseActivityFilters(
		applyDefaultPublicCourseActivityFilters({
			filters: filterConfig,
			activityKey,
			lessonNumber,
		})
	)

	return {
		activityKey,
		lessonNumber: lessonNumber == null ? null : String(lessonNumber),
		filterKeys: definition?.filterKeys ?? [],
		filters: normalizedFilters,
	}
}

export function buildPublicCourseActivitySignature({
	activityKey,
	platformCourseId,
	lessonId,
	lessonNumber,
	filterConfig,
	lessonScriptId,
	lessonScriptPartBId,
	lessonScriptReviewId,
}: {
	activityKey: PublicCourseActivityKey
	platformCourseId: number
	lessonId: number
	lessonNumber: string | number | null | undefined
	filterConfig: PublicCourseActivityFilters
	lessonScriptId?: number | null
	lessonScriptPartBId?: number | null
	lessonScriptReviewId?: number | null
}) {
	const isVideoLike =
		activityKey === 'lesson_script' ||
		activityKey === 'lesson_script_part_b' ||
		activityKey === 'lesson_script_review' ||
		activityKey === 'lesson_video' ||
		activityKey === 'lesson_song'

	if (isVideoLike) {
		const videoId = getPublicCourseActivityVideoId({
			activityKey,
			filterConfig,
			lessonScriptId,
			lessonScriptPartBId,
			lessonScriptReviewId,
		})

		return `pc:${activityKey}:${hashSignature({
			kind: 'video',
			activityKey,
			platformCourseId,
			lessonId,
			videoId,
			filterConfig: normalizePublicCourseActivityFilters(filterConfig),
		})}`
	}

	return `pc:${activityKey}:${hashSignature({
		kind: 'filtered',
		activityKey,
		platformCourseId,
		lessonId,
		...getNormalizedFilterSignature({
			activityKey,
			filterConfig,
			lessonNumber,
		}),
	})}`
}
