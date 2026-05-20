import 'server-only'

import { asc, eq } from 'drizzle-orm'
import db from '@/db/drizzle'
import { vocabEntries } from '@/db/schema'
import type { EnglishVocab, GreekVocab, HebrewVocab } from '@/lib/vocab'
import { resolveVocabMediaUrl, resolveVocabMediaUrls } from '@/lib/vocab-media'

type VocabLanguage = 'he' | 'en' | 'el'
export type VocabSourceKey =
	| 'awb'
	| 'abc'
	| 'hs'
	| 'awa'
	| 'efw'
	| 'ewb'
	| 'lr'
	| 'ec1'
	| 'ec2'

type VocabSourceConfig = {
	language: VocabLanguage
	courseId: number
}

const VOCAB_SOURCE_CONFIG = {
	awb: { language: 'he', courseId: 6 },
	hs: { language: 'he', courseId: 11 },
	abc: { language: 'he', courseId: 14 },
	awa: { language: 'el', courseId: 12 },
	efw: { language: 'en', courseId: 16 },
	ewb: { language: 'en', courseId: 13 },
	lr: { language: 'en', courseId: 17 },
	ec1: { language: 'en', courseId: 3 },
	ec2: { language: 'en', courseId: 4 },
} satisfies Record<VocabSourceKey, VocabSourceConfig>

type VocabEntryRow = typeof vocabEntries.$inferSelect

function normalizeHebrewEntry(entry: HebrewVocab): HebrewVocab {
	return {
		...entry,
		images: resolveVocabMediaUrls(entry.images),
		hebAudio: resolveVocabMediaUrl(entry.hebAudio),
		engAudio: resolveVocabMediaUrl(entry.engAudio),
	}
}

function normalizeEnglishEntry(entry: EnglishVocab): EnglishVocab {
	return {
		...entry,
		images: resolveVocabMediaUrls(entry.images),
		engAudio: resolveVocabMediaUrl(entry.engAudio),
	}
}

function normalizeGreekEntry(entry: GreekVocab): GreekVocab {
	return {
		...entry,
		images: resolveVocabMediaUrls(entry.images),
		grkAudio: resolveVocabMediaUrl(entry.grkAudio),
		engAudio: resolveVocabMediaUrl(entry.engAudio),
	}
}

function mapRowToHebrewVocab(row: VocabEntryRow): HebrewVocab {
	const payload = (row.payload ?? {}) as Partial<HebrewVocab>

	return normalizeHebrewEntry({
		id: row.entryId,
		hebNiqqud: row.lemma ?? payload.hebNiqqud ?? '',
		heb: row.heb ?? payload.heb ?? '',
		eng: row.gloss ?? payload.eng ?? '',
		engDefinition: row.hebDefinition ?? payload.engDefinition ?? '',
		genderPerson: row.genderPerson ?? payload.genderPerson ?? '',
		rootPerson:
			row.rootPerson ?? payload.rootPerson ?? (payload as { person?: string }).person ?? '',
		rootGender:
			row.rootGender ?? payload.rootGender ?? (payload as { gender?: string }).gender ?? '',
		rootNumber:
			row.rootNumber ?? payload.rootNumber ?? (payload as { number?: string }).number ?? '',
		suffixPerson: row.suffixPerson ?? payload.suffixPerson ?? '',
		suffixGender: row.suffixGender ?? payload.suffixGender ?? '',
		suffixNumber: row.suffixNumber ?? payload.suffixNumber ?? '',
		partOfSpeech: row.partOfSpeech ?? payload.partOfSpeech ?? [],
		ipa: row.ipa ?? payload.ipa ?? '',
		engTransliteration:
			row.engTransliteration ?? payload.engTransliteration ?? '',
		dictionaryUrl: row.dictionaryUrl ?? payload.dictionaryUrl ?? '',
		images: row.images ?? payload.images ?? [],
		hebAudio: row.hebAudio ?? payload.hebAudio ?? '',
		engAudio: payload.engAudio ?? '',
		synonyms: row.synonyms ?? payload.synonyms ?? [],
		antonyms: row.antonyms ?? payload.antonyms ?? [],
		lessons: row.lessons ?? payload.lessons ?? [],
		scriptures: row.scriptures ?? payload.scriptures ?? [],
		strongs: row.strongs ?? payload.strongs ?? '',
		type: row.type ?? payload.type ?? '',
		definite: row.definite ?? payload.definite ?? false,
		category: row.category ?? payload.category ?? '',
		state: row.state ?? payload.state ?? '',
		introduction: row.introduction ?? payload.introduction ?? '',
	})
}

function mapRowToEnglishVocab(row: VocabEntryRow): EnglishVocab {
	const payload = (row.payload ?? {}) as Partial<EnglishVocab>

	return normalizeEnglishEntry({
		id: row.entryId,
		lessons: row.lessons ?? payload.lessons ?? [],
		type: row.type ?? payload.type ?? '',
		definite: row.definite ?? payload.definite ?? false,
		engDefinition: row.hebDefinition ?? payload.engDefinition ?? '',
		eng: row.gloss ?? payload.eng ?? '',
		spa: row.spa ?? payload.spa ?? '',
		por: row.por ?? payload.por ?? '',
		spaTransliteration:
			row.spaTransliteration ?? payload.spaTransliteration ?? '',
		porTransliteration:
			row.porTransliteration ?? payload.porTransliteration ?? '',
		rootPerson:
			row.rootPerson ?? payload.rootPerson ?? (payload as { person?: string }).person ?? '',
		rootGender:
			row.rootGender ?? payload.rootGender ?? (payload as { gender?: string }).gender ?? '',
		rootNumber:
			row.rootNumber ?? payload.rootNumber ?? (payload as { number?: string }).number ?? '',
		suffixPerson: row.suffixPerson ?? payload.suffixPerson ?? '',
		suffixGender: row.suffixGender ?? payload.suffixGender ?? '',
		suffixNumber: row.suffixNumber ?? payload.suffixNumber ?? '',
		partOfSpeech: row.partOfSpeech ?? payload.partOfSpeech ?? [],
		ipa: row.ipa ?? payload.ipa ?? '',
		images: row.images ?? payload.images ?? [],
		engAudio: row.engAudio ?? payload.engAudio ?? '',
		category: row.category ?? payload.category ?? '',
	})
}

function mapRowToGreekVocab(row: VocabEntryRow): GreekVocab {
	const payload = (row.payload ?? {}) as Partial<GreekVocab>

	return normalizeGreekEntry({
		id: row.entryId,
		grk: row.grk ?? payload.grk ?? '',
		eng: row.gloss ?? payload.eng ?? '',
		engDefinition: row.hebDefinition ?? payload.engDefinition ?? '',
		genderPerson: row.genderPerson ?? payload.genderPerson ?? '',
		partOfSpeech: row.partOfSpeech ?? payload.partOfSpeech ?? [],
		ipa: row.ipa ?? payload.ipa ?? '',
		engTransliteration:
			row.engTransliteration ?? payload.engTransliteration ?? '',
		dictionaryUrl: row.dictionaryUrl ?? payload.dictionaryUrl ?? '',
		images: row.images ?? payload.images ?? [],
		grkAudio: row.grkAudio ?? payload.grkAudio ?? '',
		engAudio: row.engAudio ?? payload.engAudio ?? '',
		synonyms: row.synonyms ?? payload.synonyms ?? [],
		antonyms: row.antonyms ?? payload.antonyms ?? [],
		lessons: row.lessons ?? payload.lessons ?? [],
		scriptures: row.scriptures ?? payload.scriptures ?? [],
		strongs: row.strongs ?? payload.strongs ?? '',
		type: row.type ?? payload.type ?? '',
		definite: row.definite ?? payload.definite ?? false,
		category: row.category ?? payload.category ?? '',
	})
}

async function getRowsForSource(sourceKey: VocabSourceKey) {
	return db
		.select()
		.from(vocabEntries)
		.where(eq(vocabEntries.sourceKey, sourceKey))
		.orderBy(asc(vocabEntries.entryId))
}

async function getSourceData<T extends EnglishVocab | HebrewVocab | GreekVocab>(
	sourceKey: VocabSourceKey
) {
	const config = VOCAB_SOURCE_CONFIG[sourceKey]

	try {
		const rows = await getRowsForSource(sourceKey)
		if (!rows.length) return []

		if (config.language === 'he') {
			return rows.map((row) => mapRowToHebrewVocab(row)) as T[]
		}

		if (config.language === 'el') {
			return rows.map((row) => mapRowToGreekVocab(row)) as T[]
		}

		return rows.map((row) => mapRowToEnglishVocab(row)) as T[]
	} catch (error) {
		console.warn(
			`Failed to load vocab entries for "${sourceKey}" from the database.`,
			error
		)
		return []
	}
}

function getSourceKeyForCourseId(
	language: VocabLanguage,
	courseId: number,
	fallbackSource: VocabSourceKey
) {
	const match = (Object.entries(VOCAB_SOURCE_CONFIG) as [
		VocabSourceKey,
		VocabSourceConfig,
	][]).find(([, config]) => {
		return config.language === language && config.courseId === courseId
	})

	return match?.[0] ?? fallbackSource
}

export async function getHebrewVocabBySource(sourceKey: Extract<VocabSourceKey, 'awb' | 'hs' | 'abc'>) {
	return getSourceData<HebrewVocab>(sourceKey)
}

export async function getEnglishVocabBySource(
	sourceKey: Extract<VocabSourceKey, 'efw' | 'ewb' | 'lr' | 'ec1' | 'ec2'>
) {
	return getSourceData<EnglishVocab>(sourceKey)
}

export async function getGreekVocabBySource(sourceKey: Extract<VocabSourceKey, 'awa'>) {
	return getSourceData<GreekVocab>(sourceKey)
}

export async function getHebrewVocabByCourseId(courseId: number) {
	const sourceKey = getSourceKeyForCourseId('he', courseId, 'awb') as Extract<
		VocabSourceKey,
		'awb' | 'hs' | 'abc'
	>
	return getHebrewVocabBySource(sourceKey)
}

export async function getEnglishVocabByCourseId(courseId: number) {
	const sourceKey = getSourceKeyForCourseId('en', courseId, 'ec1') as Extract<
		VocabSourceKey,
		'efw' | 'ewb' | 'lr' | 'ec1' | 'ec2'
	>
	return getEnglishVocabBySource(sourceKey)
}

export async function getGreekVocabByCourseId(courseId: number) {
	return getGreekVocabBySource(
		getSourceKeyForCourseId('el', courseId, 'awa') as Extract<
			VocabSourceKey,
			'awa'
		>
	)
}
