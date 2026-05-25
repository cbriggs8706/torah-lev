import 'dotenv/config'

import { asc, eq } from 'drizzle-orm'
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
type ExistingRow = typeof vocabEntries.$inferSelect
type SourceKey = 'awb' | 'hs' | 'abc' | 'awa' | 'efw' | 'ewb' | 'lr' | 'ec1' | 'ec2'

type SyncRow = Omit<InsertRow, 'id'> & {
	legacyId: number
	sourceSynonyms: string[]
	sourceAntonyms: string[]
	sourceConfusedWith: string[]
}

const now = new Date()

function cleanMediaPath(value?: string | null) {
	if (!value) return null
	const normalized = normalizeVocabStoragePath(value.trim())
	return normalized || null
}

function cleanStringArray(values?: string[] | null) {
	return (values ?? []).filter((value): value is string => !!value?.trim())
}

function mapLegacyRelations(
	values: string[],
	legacyToDbId: Map<number, number>
) {
	return Array.from(
		new Set(
			values
				.map((value) => Number(value))
				.filter((value) => Number.isInteger(value) && value > 0)
				.map((value) => legacyToDbId.get(value))
				.filter((value): value is number => typeof value === 'number')
				.map((value) => String(value))
		)
	)
}

function getLegacyMorphologyValue(
	item: EnglishVocab & Partial<Record<'person' | 'gender' | 'number', string>>,
	key: 'person' | 'gender' | 'number'
) {
	return item[key] ?? null
}

function getLegacyIdFromPayload(payload: unknown) {
	if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null
	const rawValue = (payload as Record<string, unknown>).id
	const parsed = Number(rawValue)
	return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function toHebrewRows(
	sourceKey: 'awb' | 'hs' | 'abc',
	courseId: number,
	items: HebrewVocab[]
): SyncRow[] {
	return items.map((item) => ({
		sourceKey,
		language: 'he',
		courseId,
		legacyId: item.id ?? 0,
		lessons: cleanStringArray(item.lessons),
		type: item.type ?? null,
		category: item.category ?? null,
		gloss: item.eng,
		hebDefinition: item.engDefinition ?? null,
		partOfSpeech: item.partOfSpeech ?? [],
		ipa: item.ipa ?? null,
		images: cleanStringArray(item.images).map(cleanMediaPath).filter(Boolean) as string[],
		lemma: item.hebNiqqud,
		heb: item.heb,
		hebAudio: cleanMediaPath(item.hebAudio),
		engAudio: cleanMediaPath(item.engAudio),
		engTransliteration: item.engTransliteration ?? null,
		genderPerson: item.genderPerson ?? null,
		dictionaryUrl: item.dictionaryUrl ?? null,
		synonyms: [],
		antonyms: [],
		confusedWith: [],
		scriptures: cleanStringArray(item.scriptures),
		strongs: item.strongs ?? null,
		introduction: item.introduction ?? null,
		payload: item,
		createdAt: now,
		updatedAt: now,
		sourceSynonyms: cleanStringArray(item.synonyms),
		sourceAntonyms: cleanStringArray(item.antonyms),
		sourceConfusedWith: cleanStringArray(item.confusedWith),
	}))
}

function toEnglishRows(
	sourceKey: 'efw' | 'ewb' | 'lr' | 'ec1' | 'ec2',
	courseId: number,
	items: EnglishVocab[]
): SyncRow[] {
	return items.map((item) => ({
		sourceKey,
		language: 'en',
		courseId,
		legacyId: item.id ?? 0,
		lessons: cleanStringArray(item.lessons),
		type: item.type ?? null,
		category: item.category ?? null,
		gloss: item.eng,
		hebDefinition: item.engDefinition ?? null,
		partOfSpeech: item.partOfSpeech ?? [],
		ipa: item.ipa ?? null,
		images: cleanStringArray(item.images).map(cleanMediaPath).filter(Boolean) as string[],
		spa: item.spa,
		por: item.por,
		engAudio: cleanMediaPath(item.engAudio),
		spaTransliteration: item.spaTransliteration ?? null,
		porTransliteration: item.porTransliteration ?? null,
		rootPerson: item.rootPerson ?? getLegacyMorphologyValue(item, 'person'),
		rootGender: item.rootGender ?? getLegacyMorphologyValue(item, 'gender'),
		rootNumber: item.rootNumber ?? getLegacyMorphologyValue(item, 'number'),
		suffixPerson: item.suffixPerson ?? null,
		suffixGender: item.suffixGender ?? null,
		suffixNumber: item.suffixNumber ?? null,
		synonyms: [],
		antonyms: [],
		confusedWith: [],
		payload: {
			...item,
			rootPerson: item.rootPerson ?? getLegacyMorphologyValue(item, 'person') ?? '',
			rootGender: item.rootGender ?? getLegacyMorphologyValue(item, 'gender') ?? '',
			rootNumber: item.rootNumber ?? getLegacyMorphologyValue(item, 'number') ?? '',
			suffixPerson: item.suffixPerson ?? '',
			suffixGender: item.suffixGender ?? '',
			suffixNumber: item.suffixNumber ?? '',
		},
		createdAt: now,
		updatedAt: now,
		sourceSynonyms: cleanStringArray(item.synonyms),
		sourceAntonyms: cleanStringArray(item.antonyms),
		sourceConfusedWith: cleanStringArray(item.confusedWith),
	}))
}

function toGreekRows(
	sourceKey: 'awa',
	courseId: number,
	items: GreekVocab[]
): SyncRow[] {
	return items.map((item) => ({
		sourceKey,
		language: 'el',
		courseId,
		legacyId: item.id ?? 0,
		lessons: cleanStringArray(item.lessons),
		type: item.type ?? null,
		category: item.category ?? null,
		gloss: item.eng,
		hebDefinition: item.engDefinition ?? null,
		partOfSpeech: item.partOfSpeech ?? [],
		ipa: item.ipa ?? null,
		images: cleanStringArray(item.images).map(cleanMediaPath).filter(Boolean) as string[],
		grk: item.grk,
		grkAudio: cleanMediaPath(item.grkAudio),
		engAudio: cleanMediaPath(item.engAudio),
		engTransliteration: item.engTransliteration ?? null,
		genderPerson: item.genderPerson ?? null,
		dictionaryUrl: item.dictionaryUrl ?? null,
		synonyms: [],
		antonyms: [],
		confusedWith: [],
		scriptures: cleanStringArray(item.scriptures),
		strongs: item.strongs ?? null,
		payload: item,
		createdAt: now,
		updatedAt: now,
		sourceSynonyms: cleanStringArray(item.synonyms),
		sourceAntonyms: cleanStringArray(item.antonyms),
		sourceConfusedWith: cleanStringArray(item.confusedWith),
	}))
}

const rowsBySource: Record<SourceKey, SyncRow[]> = {
	awb: toHebrewRows('awb', 6, awbHebrewVocab as HebrewVocab[]),
	hs: toHebrewRows('hs', 11, hsHebrewVocab as HebrewVocab[]),
	abc: toHebrewRows('abc', 14, abcHebrewVocab as HebrewVocab[]),
	awa: toGreekRows('awa', 12, awaGreekVocab as GreekVocab[]),
	efw: toEnglishRows('efw', 16, efwEnglishVocab as EnglishVocab[]),
	ewb: toEnglishRows('ewb', 13, ewbEnglishVocab as EnglishVocab[]),
	lr: toEnglishRows('lr', 17, lrEnglishVocab as EnglishVocab[]),
	ec1: toEnglishRows('ec1', 3, ec1EnglishVocab as EnglishVocab[]),
	ec2: toEnglishRows('ec2', 4, ec2EnglishVocab as EnglishVocab[]),
}

function getUpsertValues(row: SyncRow): InsertRow {
	const {
		legacyId: _legacyId,
		sourceSynonyms: _sourceSynonyms,
		sourceAntonyms: _sourceAntonyms,
		sourceConfusedWith: _sourceConfusedWith,
		...values
	} = row

	return values
}

async function syncSource(sourceKey: SourceKey, rows: SyncRow[]) {
	const existingRows = await db.query.vocabEntries.findMany({
		where: eq(vocabEntries.sourceKey, sourceKey),
		orderBy: asc(vocabEntries.id),
	})

	const existingByLegacyId = new Map<number, ExistingRow>()
	for (const row of existingRows) {
		const legacyId = getLegacyIdFromPayload(row.payload)
		if (legacyId) {
			existingByLegacyId.set(legacyId, row)
		}
	}

	const legacyToDbId = new Map<number, number>()

	for (const row of rows) {
		const values = getUpsertValues(row)
		const existing = existingByLegacyId.get(row.legacyId)

		if (existing) {
			const [updated] = await db
				.update(vocabEntries)
				.set({
					...values,
					createdAt: existing.createdAt,
					updatedAt: new Date(),
				})
				.where(eq(vocabEntries.id, existing.id))
				.returning()

			legacyToDbId.set(row.legacyId, updated.id)
			continue
		}

		const [inserted] = await db
			.insert(vocabEntries)
			.values(values)
			.returning()

		legacyToDbId.set(row.legacyId, inserted.id)
	}

	for (const row of rows) {
		const dbId = legacyToDbId.get(row.legacyId)
		if (!dbId) continue

		await db
			.update(vocabEntries)
			.set({
				synonyms: mapLegacyRelations(row.sourceSynonyms, legacyToDbId),
				antonyms: mapLegacyRelations(row.sourceAntonyms, legacyToDbId),
				confusedWith: mapLegacyRelations(row.sourceConfusedWith, legacyToDbId),
				updatedAt: new Date(),
			})
			.where(eq(vocabEntries.id, dbId))
	}

	return rows.length
}

async function main() {
	let syncedCount = 0

	for (const [sourceKey, rows] of Object.entries(rowsBySource) as [SourceKey, SyncRow[]][]) {
		syncedCount += await syncSource(sourceKey, rows)
	}

	console.log(`Synced ${syncedCount} vocab rows to Supabase.`)
}

main()
	.catch((error) => {
		console.error('Failed to sync vocab to Supabase.')
		console.error(error)
		process.exit(1)
	})
