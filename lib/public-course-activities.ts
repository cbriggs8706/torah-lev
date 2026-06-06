export type PublicCourseActivityKey =
	| 'lesson_script'
	| 'introduction'
	| 'flashcards'
	| 'quiz'
	| 'matchup'
	| 'spelling'
	| 'scramble'

export type PublicCourseActivityStatus =
	| 'not_started'
	| 'in_progress'
	| 'completed'

export type PublicCourseActivityFilters = {
	selectedLessons?: string[]
	selectedCategory?: string
	selectedType?: 'all' | 'word' | 'phrase' | 'stack'
	formatType?: 'image' | 'audio' | 'translation' | 'letter-by-letter'
	hebrewField?: 'heb' | 'hebNiqqud'
	displayScript?: boolean
}

export type PublicCourseActivityDefinition = {
	key: PublicCourseActivityKey
	label: string
	iconSrc: string
	href: string | null
	filterKeys: Array<
		'selectedLessons' | 'selectedCategory' | 'selectedType' | 'formatType' | 'hebrewField'
	>
	trackProgress: boolean
	passPercent: number | null
	isFixedFirst?: boolean
}

export type PublicCourseLessonActivityConfig = {
	activityKey: PublicCourseActivityKey
	order: number
	isEnabled: boolean
	filterConfig: PublicCourseActivityFilters
}

export type ScheduledPublicCourseQuery = {
	scheduled: boolean
	courseId: number | null
	lesson: string | null
	publicCourseId: number | null
	publicCourseLessonId: number | null
	enrollmentId: number | null
	activityKey: PublicCourseActivityKey | null
	filters: PublicCourseActivityFilters
}

export const PUBLIC_COURSE_ACTIVITY_DEFINITIONS: PublicCourseActivityDefinition[] = [
	{
		key: 'lesson_script',
		label: 'Video',
		iconSrc: '/icons/iconYoutube.png',
		href: null,
		filterKeys: [],
		trackProgress: true,
		passPercent: null,
		isFixedFirst: true,
	},
	{
		key: 'introduction',
		label: 'Introduction',
		iconSrc: '/speech-balloon-svgrepo-com.svg',
		href: '/he/introduction',
		filterKeys: ['selectedLessons'],
		trackProgress: true,
		passPercent: null,
	},
	{
		key: 'flashcards',
		label: 'Flashcards',
		iconSrc: '/icons/iconFlashcards.png',
		href: '/he/flashcards',
		filterKeys: ['selectedLessons', 'selectedCategory', 'selectedType'],
		trackProgress: false,
		passPercent: null,
	},
	{
		key: 'quiz',
		label: 'Quiz',
		iconSrc: '/gameIcons/quiz.png',
		href: '/he/quiz',
		filterKeys: ['selectedLessons'],
		trackProgress: true,
		passPercent: 75,
	},
	{
		key: 'matchup',
		label: 'Matchup',
		iconSrc: '/icons/iconSocks.png',
		href: '/he/matchup',
		filterKeys: [
			'selectedLessons',
			'selectedCategory',
			'selectedType',
			'formatType',
			'hebrewField',
		],
		trackProgress: true,
		passPercent: 75,
	},
	{
		key: 'spelling',
		label: 'Spelling',
		iconSrc: '/icons/iconSpelling.png',
		href: '/he/spelling',
		filterKeys: ['selectedLessons', 'selectedCategory', 'selectedType', 'formatType'],
		trackProgress: false,
		passPercent: null,
	},
	{
		key: 'scramble',
		label: 'Scramble',
		iconSrc: '/icons/iconScrambled.png',
		href: '/he/scramble',
		filterKeys: ['selectedLessons'],
		trackProgress: true,
		passPercent: 100,
	},
]

const definitionMap = new Map(
	PUBLIC_COURSE_ACTIVITY_DEFINITIONS.map((definition) => [definition.key, definition])
)

export function getPublicCourseActivityDefinition(key: PublicCourseActivityKey) {
	return definitionMap.get(key) ?? null
}

export function getDefaultPublicCourseLessonActivities(): PublicCourseLessonActivityConfig[] {
	return PUBLIC_COURSE_ACTIVITY_DEFINITIONS.map((activity, index) => ({
		activityKey: activity.key,
		order: index + 1,
		isEnabled: true,
		filterConfig: {},
	}))
}

export function normalizePublicCourseActivityFilters(
	value: unknown
): PublicCourseActivityFilters {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return {}
	}

	const raw = value as Record<string, unknown>
	const filters: PublicCourseActivityFilters = {}

	if (Array.isArray(raw.selectedLessons)) {
		filters.selectedLessons = raw.selectedLessons
			.filter((lesson): lesson is string => typeof lesson === 'string')
			.filter(Boolean)
	}

	if (typeof raw.selectedCategory === 'string' && raw.selectedCategory.trim()) {
		filters.selectedCategory = raw.selectedCategory
	}

	if (
		raw.selectedType === 'all' ||
		raw.selectedType === 'word' ||
		raw.selectedType === 'phrase' ||
		raw.selectedType === 'stack'
	) {
		filters.selectedType = raw.selectedType
	}

	if (
		raw.formatType === 'image' ||
		raw.formatType === 'audio' ||
		raw.formatType === 'translation' ||
		raw.formatType === 'letter-by-letter'
	) {
		filters.formatType = raw.formatType
	}

	if (raw.hebrewField === 'heb' || raw.hebrewField === 'hebNiqqud') {
		filters.hebrewField = raw.hebrewField
	}

	if (typeof raw.displayScript === 'boolean') {
		filters.displayScript = raw.displayScript
	}

	return filters
}

export function encodePublicCourseFilters(filters: PublicCourseActivityFilters) {
	const normalized = normalizePublicCourseActivityFilters(filters)
	return JSON.stringify(normalized)
}

export function parsePublicCourseFilters(value: string | null | undefined) {
	if (!value) return {}

	try {
		return normalizePublicCourseActivityFilters(JSON.parse(value))
	} catch {
		return {}
	}
}

export function parseScheduledPublicCourseQuery(
	searchParams: Record<string, string | string[] | undefined>
): ScheduledPublicCourseQuery {
	const rawCourseId = searchParams.courseId
	const rawLesson = searchParams.lesson
	const rawPublicCourseId = searchParams.publicCourseId
	const rawPublicCourseLessonId = searchParams.publicCourseLessonId
	const rawEnrollmentId = searchParams.enrollmentId
	const rawActivityKey = searchParams.publicCourseActivityKey
	const rawFilters = searchParams.publicCourseFilters

	const courseId =
		typeof rawCourseId === 'string' && Number.isFinite(Number(rawCourseId))
			? Number(rawCourseId)
			: null
	const lesson = typeof rawLesson === 'string' && rawLesson ? rawLesson : null
	const publicCourseId =
		typeof rawPublicCourseId === 'string' &&
		Number.isFinite(Number(rawPublicCourseId))
			? Number(rawPublicCourseId)
			: null
	const publicCourseLessonId =
		typeof rawPublicCourseLessonId === 'string' &&
		Number.isFinite(Number(rawPublicCourseLessonId))
			? Number(rawPublicCourseLessonId)
			: null
	const enrollmentId =
		typeof rawEnrollmentId === 'string' && Number.isFinite(Number(rawEnrollmentId))
			? Number(rawEnrollmentId)
			: null
	const activityKey =
		typeof rawActivityKey === 'string' &&
		definitionMap.has(rawActivityKey as PublicCourseActivityKey)
			? (rawActivityKey as PublicCourseActivityKey)
			: null
	const filters = parsePublicCourseFilters(
		typeof rawFilters === 'string' ? rawFilters : null
	)

	return {
		scheduled:
			searchParams.scheduled === '1' && courseId !== null && lesson !== null,
		courseId,
		lesson,
		publicCourseId,
		publicCourseLessonId,
		enrollmentId,
		activityKey,
		filters,
	}
}

export function buildPublicCourseActivityHref({
	activityKey,
	courseId,
	lessonNumber,
	publicCourseId,
	publicCourseLessonId,
	enrollmentId,
	lessonScriptId,
	filterConfig,
}: {
	activityKey: PublicCourseActivityKey
	courseId: number
	lessonNumber: string
	publicCourseId: number
	publicCourseLessonId: number
	enrollmentId: number | null
	lessonScriptId?: number | null
	filterConfig: PublicCourseActivityFilters
}) {
	const definition = getPublicCourseActivityDefinition(activityKey)
	if (!definition) return null

	const href =
		activityKey === 'lesson_script'
			? lessonScriptId
				? `/he/videos/${lessonScriptId}`
				: null
			: definition.href

	if (!href) return null

	const params = new URLSearchParams({
		scheduled: '1',
		courseId: String(courseId),
		lesson: lessonNumber,
		publicCourseId: String(publicCourseId),
		publicCourseLessonId: String(publicCourseLessonId),
		publicCourseActivityKey: activityKey,
	})

	if (enrollmentId) {
		params.set('enrollmentId', String(enrollmentId))
	}

	const normalizedFilters = normalizePublicCourseActivityFilters(filterConfig)
	if (Object.keys(normalizedFilters).length > 0) {
		params.set('publicCourseFilters', encodePublicCourseFilters(normalizedFilters))
	}

	return `${href}?${params.toString()}`
}
