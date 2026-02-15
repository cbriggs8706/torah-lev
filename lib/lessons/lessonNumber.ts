export function parseLessonNumber(input: string): {
	lessonGroupNumber: number | null
	lessonVariant: string
} {
	const normalized = input.trim().toLowerCase()
	if (!normalized) {
		return { lessonGroupNumber: null, lessonVariant: '' }
	}

	const match = normalized.match(/(?:lesson\s*)?(\d+)\s*([a-z]+)?/)
	if (!match) {
		return { lessonGroupNumber: null, lessonVariant: '' }
	}

	return {
		lessonGroupNumber: Number.parseInt(match[1], 10),
		lessonVariant: (match[2] ?? '').toLowerCase(),
	}
}

