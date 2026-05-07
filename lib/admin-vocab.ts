import { normalizeVocabStoragePath, resolveVocabMediaUrl } from '@/lib/vocab-media'

export const vocabLanguageChoices = [
	{ id: 'he', name: 'Hebrew' },
	{ id: 'en', name: 'English' },
	{ id: 'el', name: 'Greek' },
] as const

export const vocabSourceChoices = [
	{ id: 'awb', name: 'AwB' },
	{ id: 'hs', name: 'HS' },
	{ id: 'abc', name: 'ABC' },
	{ id: 'awa', name: 'AWA' },
	{ id: 'efw', name: 'EfW' },
	{ id: 'ewb', name: 'EwB' },
	{ id: 'lr', name: 'LR' },
	{ id: 'ec1', name: 'EC1' },
	{ id: 'ec2', name: 'EC2' },
] as const

export function parseStringList(input: unknown) {
	if (Array.isArray(input)) {
		return input
			.map((value) => (typeof value === 'string' ? value.trim() : ''))
			.filter(Boolean)
	}

	if (typeof input !== 'string') return []

	return input
		.split(/\r?\n|,/)
		.map((value) => value.trim())
		.filter(Boolean)
}

export function stringifyStringList(input: unknown) {
	return parseStringList(input).join('\n')
}

function parseLessonParts(value?: string | null) {
	if (!value) return { num: Number.MAX_SAFE_INTEGER, suffix: '' }
	const match = value.match(/(\d+)([a-zA-Z]*)/)
	if (!match) return { num: Number.MAX_SAFE_INTEGER, suffix: value }
	return {
		num: Number(match[1]),
		suffix: match[2] ?? '',
	}
}

export function getFirstLesson(lessons?: string[] | null) {
	return (lessons ?? [])[0] ?? ''
}

export function getLessonSortValue(lessons?: string[] | null) {
	const firstLesson = getFirstLesson(lessons)
	const { num, suffix } = parseLessonParts(firstLesson)
	return `${String(num).padStart(8, '0')}:${suffix}:${firstLesson}`
}

export function hasPrimaryAudio(entry: {
	language?: string | null
	hebAudio?: string | null
	engAudio?: string | null
	grkAudio?: string | null
}) {
	switch (entry.language) {
		case 'he':
			return !!entry.hebAudio
		case 'en':
			return !!entry.engAudio
		case 'el':
			return !!entry.grkAudio
		default:
			return !!entry.hebAudio || !!entry.engAudio || !!entry.grkAudio
	}
}

export function normalizeMediaList(values: unknown) {
	return parseStringList(values).map((value) => normalizeVocabStoragePath(value))
}

export function toVocabAdminRecord(
	entry: {
		id: number
		sourceKey: string
		language: string
		courseId: number | null
		entryId: number
		lessons: string[]
		type: string | null
		definite: boolean
		category: string | null
		eng: string | null
		engDefinition: string | null
		partOfSpeech: string[] | null
		ipa: string | null
		images: string[]
		hebNiqqud: string | null
		heb: string | null
		hebAudio: string | null
		grk: string | null
		grkAudio: string | null
		spa: string | null
		por: string | null
		engAudio: string | null
		engTransliteration: string | null
		spaTransliteration: string | null
		porTransliteration: string | null
		genderPerson: string | null
		person: string | null
		gender: string | null
		number: string | null
		dictionaryUrl: string | null
		synonyms: string[] | null
		antonyms: string[] | null
		scriptures: string[] | null
		strongs: string | null
		introduction: string | null
		absoluteEntryId: number | null
		payload: unknown
		createdAt: Date
		updatedAt: Date
	}
) {
	const firstLesson = getFirstLesson(entry.lessons)
	const lessonSort = getLessonSortValue(entry.lessons)
	const missingImage = (entry.images ?? []).length === 0
	const missingAudio = !hasPrimaryAudio(entry)

	return {
		...entry,
		firstLesson,
		lessonSort,
		missingImage,
		missingAudio,
		partOfSpeechText: stringifyStringList(entry.partOfSpeech),
		lessonsText: stringifyStringList(entry.lessons),
		imagesText: stringifyStringList(entry.images),
		synonymsText: stringifyStringList(entry.synonyms),
		antonymsText: stringifyStringList(entry.antonyms),
		scripturesText: stringifyStringList(entry.scriptures),
		primaryAudioUrl: resolveVocabMediaUrl(
			entry.language === 'he'
				? entry.hebAudio
				: entry.language === 'el'
				? entry.grkAudio
				: entry.engAudio
		),
		firstImageUrl: resolveVocabMediaUrl(entry.images?.[0]),
	}
}
