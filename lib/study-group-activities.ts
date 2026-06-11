type StudyGroupActivityLink = {
	key:
		| 'introduction'
		| 'flashcards'
		| 'quiz'
		| 'matchup'
		| 'opposites'
		| 'spelling'
		| 'scramble'
	label: string
	href: string
	iconSrc: string
}

type ScheduledActivityContext = {
	courseId: number
	lessonNumber: string
	publicCourseId?: number | null
	publicCourseLessonId?: number | null
	enrollmentId?: number | null
}

function buildScheduledQuery(context: ScheduledActivityContext) {
	const params = new URLSearchParams({
		scheduled: '1',
		courseId: String(context.courseId),
		lesson: context.lessonNumber,
	})

	if (context.publicCourseId) {
		params.set('publicCourseId', String(context.publicCourseId))
	}

	if (context.publicCourseLessonId) {
		params.set('publicCourseLessonId', String(context.publicCourseLessonId))
	}

	if (context.enrollmentId) {
		params.set('enrollmentId', String(context.enrollmentId))
	}

	return params.toString()
}

export function getHebrewScheduledActivityLinks(
	context: ScheduledActivityContext | null
): StudyGroupActivityLink[] {
	if (!context?.courseId || !context.lessonNumber) return []

	const query = buildScheduledQuery(context)

	if ([6, 11, 14, 21].includes(context.courseId)) {
		return [
			{
				key: 'introduction',
				label: 'Vocabulary',
				href: `/he/vocabulary?${query}`,
				iconSrc: '/speech-balloon-svgrepo-com.svg',
			},
			{
				key: 'flashcards',
				label: 'Flashcards',
				href: `/he/flashcards?${query}`,
				iconSrc: '/icons/iconFlashcards.png',
			},
			{
				key: 'quiz',
				label: 'Quiz',
				href: `/he/quiz?${query}`,
				iconSrc: '/gameIcons/quiz.png',
			},
			{
				key: 'matchup',
				label: 'Matchup',
				href: `/he/matchup?${query}`,
				iconSrc: '/icons/iconSocks.png',
			},
			{
				key: 'opposites',
				label: 'Opposites',
				href: `/he/opposites?${query}`,
				iconSrc: '/icons/iconSocks.png',
			},
			{
				key: 'spelling',
				label: 'Spelling',
				href: `/he/spelling?${query}`,
				iconSrc: '/icons/iconSpelling.png',
			},
			{
				key: 'scramble',
				label: 'Scramble',
				href: `/he/scramble?${query}`,
				iconSrc: '/icons/iconScrambled.png',
			},
		]
	}

	return []
}

export function getStudyGroupScheduledActivityLinks(
	courseId: number | null,
	lessonNumber: string | null
) {
	if (!courseId || !lessonNumber) return []

	return getHebrewScheduledActivityLinks({
		courseId,
		lessonNumber,
	})
}
