import type { PublicCourseActivityKey } from '@/lib/public-course-activities'

export type PublicCourseActivityProgressPayload = {
	enrollmentId: number
	publicCourseLessonId: number
	activityKey: PublicCourseActivityKey
	scorePercent?: number
	metadata?: Record<string, unknown>
}

export async function markPublicCourseActivityComplete(
	payload: PublicCourseActivityProgressPayload
) {
	const response = await fetch('/api/public-course-activity-progress', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(payload),
	})

	const data = await response.json().catch(() => ({}))

	if (!response.ok) {
		throw new Error(
			typeof data?.error === 'string'
				? data.error
				: 'Failed to save public course activity progress.'
		)
	}

	return data.progress
}
