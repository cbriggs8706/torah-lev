import 'server-only'

import { asc, eq } from 'drizzle-orm'
import db from '@/db/drizzle'
import { vocabEntries } from '@/db/schema'
import type { EnglishVocab, GreekVocab, HebrewVocab } from '@/lib/vocab'
import { resolveVocabMediaUrl, resolveVocabMediaUrls } from '@/lib/vocab-media'

import awbHebrewVocab from '@/lib/data/vocab/awbVocab.json'
import abcHebrewVocab from '@/lib/data/vocab/abcVocab.json'
import awaGreekVocab from '@/lib/data/vocab/awaVocab.json'
import ec1EnglishVocab from '@/lib/data/vocab/ec1Vocab.json'
import ec2EnglishVocab from '@/lib/data/vocab/ec2Vocab.json'
import efwEnglishVocab from '@/lib/data/vocab/efwVocab.json'
import ewbEnglishVocab from '@/lib/data/vocab/ewbVocab.json'
import hsHebrewVocab from '@/lib/data/vocab/hsVocab.json'
import lrEnglishVocab from '@/lib/data/vocab/lrVocab.json'

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

type VocabSourceConfig<T> = {
	language: VocabLanguage
	courseId: number
	fallback: T[]
}

const VOCAB_SOURCE_CONFIG = {
	awb: { language: 'he', courseId: 6, fallback: awbHebrewVocab as HebrewVocab[] },
	hs: { language: 'he', courseId: 11, fallback: hsHebrewVocab as HebrewVocab[] },
	abc: { language: 'he', courseId: 14, fallback: abcHebrewVocab as HebrewVocab[] },
	awa: { language: 'el', courseId: 12, fallback: awaGreekVocab as GreekVocab[] },
	efw: { language: 'en', courseId: 16, fallback: efwEnglishVocab as EnglishVocab[] },
	ewb: { language: 'en', courseId: 13, fallback: ewbEnglishVocab as EnglishVocab[] },
	lr: { language: 'en', courseId: 17, fallback: lrEnglishVocab as EnglishVocab[] },
	ec1: { language: 'en', courseId: 3, fallback: ec1EnglishVocab as EnglishVocab[] },
	ec2: { language: 'en', courseId: 4, fallback: ec2EnglishVocab as EnglishVocab[] },
} satisfies Record<VocabSourceKey, VocabSourceConfig<EnglishVocab | HebrewVocab | GreekVocab>>

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

function normalizeFallback<T extends EnglishVocab | HebrewVocab | GreekVocab>(
	items: T[],
	language: VocabLanguage
) {
	if (language === 'he') {
		return items.map((item) => normalizeHebrewEntry(item as HebrewVocab)) as T[]
	}

	if (language === 'el') {
		return items.map((item) => normalizeGreekEntry(item as GreekVocab)) as T[]
	}

	return items.map((item) => normalizeEnglishEntry(item as EnglishVocab)) as T[]
}

function mapRowToHebrewVocab(row: VocabEntryRow): HebrewVocab {
	const payload = (row.payload ?? {}) as Partial<HebrewVocab>

	return normalizeHebrewEntry({
		id: row.entryId,
		hebNiqqud: row.hebNiqqud ?? payload.hebNiqqud ?? '',
		heb: row.heb ?? payload.heb ?? '',
		eng: row.eng ?? payload.eng ?? '',
		engDefinition: row.engDefinition ?? payload.engDefinition ?? '',
		genderPerson: row.genderPerson ?? payload.genderPerson ?? '',
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
		category: row.category ?? payload.category ?? '',
		introduction: row.introduction ?? payload.introduction ?? '',
	})
}

function mapRowToEnglishVocab(row: VocabEntryRow): EnglishVocab {
	const payload = (row.payload ?? {}) as Partial<EnglishVocab>

	return normalizeEnglishEntry({
		id: row.entryId,
		lessons: row.lessons ?? payload.lessons ?? [],
		type: row.type ?? payload.type ?? '',
		engDefinition: row.engDefinition ?? payload.engDefinition ?? '',
		eng: row.eng ?? payload.eng ?? '',
		spa: row.spa ?? payload.spa ?? '',
		por: row.por ?? payload.por ?? '',
		spaTransliteration:
			row.spaTransliteration ?? payload.spaTransliteration ?? '',
		porTransliteration:
			row.porTransliteration ?? payload.porTransliteration ?? '',
		person: row.person ?? payload.person ?? '',
		gender: row.gender ?? payload.gender ?? '',
		number: row.number ?? payload.number ?? '',
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
		eng: row.eng ?? payload.eng ?? '',
		engDefinition: row.engDefinition ?? payload.engDefinition ?? '',
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
		if (!rows.length) {
			return normalizeFallback(config.fallback as T[], config.language)
		}

		if (config.language === 'he') {
			return rows.map((row) => mapRowToHebrewVocab(row)) as T[]
		}

		if (config.language === 'el') {
			return rows.map((row) => mapRowToGreekVocab(row)) as T[]
		}

		return rows.map((row) => mapRowToEnglishVocab(row)) as T[]
	} catch (error) {
		console.warn(`Falling back to local vocab for "${sourceKey}".`, error)
		return normalizeFallback(config.fallback as T[], config.language)
	}
}

function getSourceKeyForCourseId(
	language: VocabLanguage,
	courseId: number,
	fallbackSource: VocabSourceKey
) {
	const match = (Object.entries(VOCAB_SOURCE_CONFIG) as [
		VocabSourceKey,
		VocabSourceConfig<EnglishVocab | HebrewVocab | GreekVocab>,
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
