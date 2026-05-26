type StudyGroupActivityLink = {
	key: 'introduction' | 'flashcards' | 'quiz' | 'matchup'
	label: string
	href: string
}

function buildScheduledQuery(courseId: number, lessonNumber: string) {
	const params = new URLSearchParams({
		scheduled: '1',
		courseId: String(courseId),
		lesson: lessonNumber,
	})

	return params.toString()
}

export function getStudyGroupScheduledActivityLinks(
	courseId: number | null,
	lessonNumber: string | null
): StudyGroupActivityLink[] {
	if (!courseId || !lessonNumber) return []

	const query = buildScheduledQuery(courseId, lessonNumber)

	if ([6, 11, 14, 21].includes(courseId)) {
		return [
			{
				key: 'introduction',
				label: 'Introduction',
				href: `/he/introduction?${query}`,
			},
			{
				key: 'flashcards',
				label: 'Flashcards',
				href: `/he/flashcards?${query}`,
			},
			{
				key: 'quiz',
				label: 'Quiz',
				href: `/he/quiz?${query}`,
			},
			{
				key: 'matchup',
				label: 'Matchup',
				href: `/he/matchup?${query}`,
			},
		]
	}

	return []
}
