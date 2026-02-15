export function slugifyLessonTitle(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.replace(/['"]/g, '')
		// Keep only English letters/numbers for slug source.
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
}

export function buildLessonSlug(title: string, lessonNumber: string): string {
	const titleSlug = slugifyLessonTitle(title)
	const lessonSuffix = lessonNumber.trim().toLowerCase().replace(/[^a-z0-9]+/g, '')
	const fallbackBase = lessonSuffix ? `lesson-${lessonSuffix}` : 'lesson'

	// Fallback for non-English titles (or titles that normalize to empty).
	if (!titleSlug) {
		return fallbackBase
	}

	return lessonSuffix ? `${titleSlug}-${lessonSuffix}` : titleSlug
}
