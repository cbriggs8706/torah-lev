export type ConstructAbsoluteWord = {
	id: number
	lessonId: number | null
	lessonNumber: string
	lessonTitle: string
	absolute: string
	construct: string
}

type FallbackWord = Omit<ConstructAbsoluteWord, 'lessonId' | 'lessonTitle'> & {
	lessonId?: number | null
	lessonTitle?: string
}

export const fallbackConstructAbsoluteWords: FallbackWord[] = [
	{
		id: 1,
		lessonNumber: '1',
		absolute: 'מֶלֶךְ',
		construct: 'מֶלֶךְ־',
	},
	{
		id: 2,
		lessonNumber: '1',
		absolute: 'דָּבָר',
		construct: 'דְּבַר־',
	},
	{
		id: 3,
		lessonNumber: '1',
		absolute: 'בַּיִת',
		construct: 'בֵּית־',
	},
	{
		id: 4,
		lessonNumber: '2',
		absolute: 'עַם',
		construct: 'עַם־',
	},
	{
		id: 5,
		lessonNumber: '2',
		absolute: 'עִיר',
		construct: 'עִיר־',
	},
	{
		id: 6,
		lessonNumber: '2',
		absolute: 'יוֹם',
		construct: 'יוֹם־',
	},
	{
		id: 7,
		lessonNumber: '3',
		absolute: 'אִשָּׁה',
		construct: 'אֵשֶׁת־',
	},
	{
		id: 8,
		lessonNumber: '3',
		absolute: 'בֵּן',
		construct: 'בֶּן־',
	},
]

export function getLessonNumberSortValue(lessonNumber?: string | null) {
	if (!lessonNumber) return `${String(Number.MAX_SAFE_INTEGER)}:`
	const match = lessonNumber.match(/(\d+)([a-zA-Z]*)/)
	if (!match) return `${String(Number.MAX_SAFE_INTEGER)}:${lessonNumber}`

	return `${match[1].padStart(8, '0')}:${match[2] ?? ''}:${lessonNumber}`
}

export function toConstructAbsoluteWord(
	word: FallbackWord
): ConstructAbsoluteWord {
	return {
		...word,
		lessonId: word.lessonId ?? null,
		lessonTitle: word.lessonTitle ?? `Lesson ${word.lessonNumber}`,
	}
}
