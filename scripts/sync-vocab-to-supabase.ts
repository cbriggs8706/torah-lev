import 'dotenv/config'

import db from '@/db/drizzle'
import { vocabEntries } from '@/db/schema'
import type { EnglishVocab, GreekVocab, HebrewVocab } from '@/lib/vocab'
import { normalizeVocabStoragePath } from '@/lib/vocab-media'

import awbHebrewVocab from '@/lib/data/vocab/awbVocab.json'
import abcHebrewVocab from '@/lib/data/vocab/abcVocab.json'
import awaGreekVocab from '@/lib/data/vocab/awaVocab.json'
import ec1EnglishVocab from '@/lib/data/vocab/ec1Vocab.json'
import ec2EnglishVocab from '@/lib/data/vocab/ec2Vocab.json'
import efwEnglishVocab from '@/lib/data/vocab/efwVocab.json'
import ewbEnglishVocab from '@/lib/data/vocab/ewbVocab.json'
import hsHebrewVocab from '@/lib/data/vocab/hsVocab.json'
import lrEnglishVocab from '@/lib/data/vocab/lrVocab.json'

type InsertRow = typeof vocabEntries.$inferInsert

const now = new Date()

function cleanMediaPath(value?: string | null) {
	if (!value) return null
	const normalized = normalizeVocabStoragePath(value.trim())
	return normalized || null
}

function cleanStringArray(values?: string[] | null) {
	return (values ?? []).filter((value): value is string => !!value?.trim())
}

function toHebrewRows(
	sourceKey: 'awb' | 'hs' | 'abc',
	courseId: number,
	items: HebrewVocab[]
): InsertRow[] {
	return items.map((item) => ({
		sourceKey,
		language: 'he',
		courseId,
		entryId: item.id ?? 0,
		lessons: cleanStringArray(item.lessons),
		type: item.type ?? null,
		category: item.category ?? null,
		eng: item.eng,
		engDefinition: item.engDefinition ?? null,
		partOfSpeech: item.partOfSpeech ?? [],
		ipa: item.ipa ?? null,
		images: cleanStringArray(item.images).map(cleanMediaPath).filter(Boolean) as string[],
		hebNiqqud: item.hebNiqqud,
		heb: item.heb,
		hebAudio: cleanMediaPath(item.hebAudio),
		engAudio: cleanMediaPath(item.engAudio),
		engTransliteration: item.engTransliteration ?? null,
		genderPerson: item.genderPerson ?? null,
		dictionaryUrl: item.dictionaryUrl ?? null,
		synonyms: cleanStringArray(item.synonyms),
		antonyms: cleanStringArray(item.antonyms),
		scriptures: cleanStringArray(item.scriptures),
		strongs: item.strongs ?? null,
		introduction: item.introduction ?? null,
		payload: item,
		createdAt: now,
		updatedAt: now,
	}))
}

function toEnglishRows(
	sourceKey: 'efw' | 'ewb' | 'lr' | 'ec1' | 'ec2',
	courseId: number,
	items: EnglishVocab[]
): InsertRow[] {
	return items.map((item) => ({
		sourceKey,
		language: 'en',
		courseId,
		entryId: item.id ?? 0,
		lessons: cleanStringArray(item.lessons),
		type: item.type ?? null,
		category: item.category ?? null,
		eng: item.eng,
		engDefinition: item.engDefinition ?? null,
		partOfSpeech: item.partOfSpeech ?? [],
		ipa: item.ipa ?? null,
		images: cleanStringArray(item.images).map(cleanMediaPath).filter(Boolean) as string[],
		spa: item.spa,
		por: item.por,
		engAudio: cleanMediaPath(item.engAudio),
		spaTransliteration: item.spaTransliteration ?? null,
		porTransliteration: item.porTransliteration ?? null,
		person: item.person ?? null,
		gender: item.gender ?? null,
		number: item.number ?? null,
		payload: item,
		createdAt: now,
		updatedAt: now,
	}))
}

function toGreekRows(
	sourceKey: 'awa',
	courseId: number,
	items: GreekVocab[]
): InsertRow[] {
	return items.map((item) => ({
		sourceKey,
		language: 'el',
		courseId,
		entryId: item.id ?? 0,
		lessons: cleanStringArray(item.lessons),
		type: item.type ?? null,
		category: item.category ?? null,
		eng: item.eng,
		engDefinition: item.engDefinition ?? null,
		partOfSpeech: item.partOfSpeech ?? [],
		ipa: item.ipa ?? null,
		images: cleanStringArray(item.images).map(cleanMediaPath).filter(Boolean) as string[],
		grk: item.grk,
		grkAudio: cleanMediaPath(item.grkAudio),
		engAudio: cleanMediaPath(item.engAudio),
		engTransliteration: item.engTransliteration ?? null,
		genderPerson: item.genderPerson ?? null,
		dictionaryUrl: item.dictionaryUrl ?? null,
		synonyms: cleanStringArray(item.synonyms),
		antonyms: cleanStringArray(item.antonyms),
		scriptures: cleanStringArray(item.scriptures),
		strongs: item.strongs ?? null,
		payload: item,
		createdAt: now,
		updatedAt: now,
	}))
}

const allRows: InsertRow[] = [
	...toHebrewRows('awb', 6, awbHebrewVocab as HebrewVocab[]),
	...toHebrewRows('hs', 11, hsHebrewVocab as HebrewVocab[]),
	...toHebrewRows('abc', 14, abcHebrewVocab as HebrewVocab[]),
	...toGreekRows('awa', 12, awaGreekVocab as GreekVocab[]),
	...toEnglishRows('efw', 16, efwEnglishVocab as EnglishVocab[]),
	...toEnglishRows('ewb', 13, ewbEnglishVocab as EnglishVocab[]),
	...toEnglishRows('lr', 17, lrEnglishVocab as EnglishVocab[]),
	...toEnglishRows('ec1', 3, ec1EnglishVocab as EnglishVocab[]),
	...toEnglishRows('ec2', 4, ec2EnglishVocab as EnglishVocab[]),
]

async function main() {
	for (const row of allRows) {
		await db
			.insert(vocabEntries)
			.values(row)
			.onConflictDoUpdate({
				target: [vocabEntries.sourceKey, vocabEntries.entryId],
				set: {
					language: row.language,
					courseId: row.courseId,
					lessons: row.lessons,
					type: row.type,
					category: row.category,
					eng: row.eng,
					engDefinition: row.engDefinition,
					partOfSpeech: row.partOfSpeech,
					ipa: row.ipa,
					images: row.images,
					hebNiqqud: row.hebNiqqud,
					heb: row.heb,
					hebAudio: row.hebAudio,
					grk: row.grk,
					grkAudio: row.grkAudio,
					spa: row.spa,
					por: row.por,
					engAudio: row.engAudio,
					engTransliteration: row.engTransliteration,
					spaTransliteration: row.spaTransliteration,
					porTransliteration: row.porTransliteration,
					genderPerson: row.genderPerson,
					person: row.person,
					gender: row.gender,
					number: row.number,
					dictionaryUrl: row.dictionaryUrl,
					synonyms: row.synonyms,
					antonyms: row.antonyms,
					scriptures: row.scriptures,
					strongs: row.strongs,
					introduction: row.introduction,
					payload: row.payload,
					updatedAt: new Date(),
				},
			})
	}

	console.log(`Synced ${allRows.length} vocab rows to Supabase.`)
}

main()
	.catch((error) => {
		console.error('Failed to sync vocab to Supabase.')
		console.error(error)
		process.exit(1)
	})
