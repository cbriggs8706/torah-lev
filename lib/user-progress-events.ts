export const USER_PROGRESS_UPDATED_EVENT = 'user-progress-updated'

export function dispatchUserProgressUpdated(detail: {
	hearts?: number
	points?: number
}) {
	if (typeof window === 'undefined') return

	window.dispatchEvent(
		new CustomEvent(USER_PROGRESS_UPDATED_EVENT, {
			detail,
		}),
	)
}
