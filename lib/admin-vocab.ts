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

export const vocabBinyanChoices = [
	{ id: 'qal', name: 'Qal' },
	{ id: 'niphal', name: 'Niphal' },
	{ id: 'piel', name: 'Piel' },
	{ id: 'pual', name: 'Pual' },
	{ id: 'hiphil', name: 'Hiphil' },
	{ id: 'hophal', name: 'Hophal' },
	{ id: 'hithpael', name: 'Hithpael' },
] as const

export const vocabTenseAspectChoices = [
	{ id: 'qatal', name: 'Qatal (Perfect)' },
	{ id: 'yiqtol', name: 'Yiqtol (Imperfect)' },
	{ id: 'wayyiqtol', name: 'Wayyiqtol' },
	{ id: 'weqatal', name: 'Weqatal' },
	{ id: 'participle', name: 'Participle' },
	{ id: 'infinitiveConstruct', name: 'Infinitive Construct' },
	{ id: 'infinitiveAbsolute', name: 'Infinitive Absolute' },
	{ id: 'imperative', name: 'Imperative' },
] as const

export const vocabStateChoices = [
	{ id: 'absolute', name: 'Absolute' },
	{ id: 'construct', name: 'Construct' },
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
		lessons: string[]
		type: string | null
		definite: boolean
		category: string | null
		gloss: string | null
		hebDefinition: string | null
		partOfSpeech: string[] | null
		ipa: string | null
		images: string[]
		lemma: string | null
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
		rootPerson: string | null
		rootGender: string | null
		rootNumber: string | null
		suffixPerson: string | null
		suffixGender: string | null
		suffixNumber: string | null
		dictionaryUrl: string | null
		synonyms: string[] | null
		antonyms: string[] | null
		confusedWith: string[] | null
		scriptures: string[] | null
		strongs: string | null
		introduction: string | null
		rootVerb: string | null
		binyan: string | null
		tenseAspect: string | null
		state: string | null
		rootId: number | null
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
		hebNiqqud: entry.lemma,
		eng: entry.gloss,
		engDefinition: entry.hebDefinition,
		firstLesson,
		lessonSort,
		missingImage,
		missingAudio,
		partOfSpeechText: stringifyStringList(entry.partOfSpeech),
		lessonsText: stringifyStringList(entry.lessons),
		imagesText: stringifyStringList(entry.images),
		synonymsText: stringifyStringList(entry.synonyms),
		antonymsText: stringifyStringList(entry.antonyms),
		confusedWithText: stringifyStringList(entry.confusedWith),
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
