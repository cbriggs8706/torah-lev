import { createHash } from 'crypto'
import { and, eq, inArray, notInArray } from 'drizzle-orm'
import { supabaseDb as db } from '@/db'
import { customHebrewLexemes } from '@/db/schema/tables/custom_hebrew_lexemes'
import { hebrewLexemes } from '@/db/schema/tables/hebrew_lexemes'
import {
	lessonNewVocab,
	lessonScriptVocab,
	lessonVocabTerms,
} from '@/db/schema/tables/lesson_vocab'
import {
	normalizeHebrewToConsonants,
	splitIntoVerseParagraphs,
} from './ingestCustomHebrewText'

type LessonVocabDb = {
	select: typeof db.select
	insert: typeof db.insert
	delete: typeof db.delete
	update: typeof db.update
}

export type LexemeSource = 'BIBLICAL' | 'CUSTOM'

export type LessonScriptLexemeCandidate = {
	source: LexemeSource
	id: string
	lemma: string
	consonants: string
}

export type LessonScriptAnalyzedToken = {
	tokenKey: string
	surface: string
	consonants: string
	known: boolean
	candidates: LessonScriptLexemeCandidate[]
	selectedCandidate: LessonScriptLexemeCandidate | null
}

export type LessonScriptAnalyzedVerse = {
	verseNumber: number
	text: string
	tokens: LessonScriptAnalyzedToken[]
}

export type LessonScriptAnalysis = {
	digest: string
	verseCount: number
	tokenCount: number
	knownTokenCount: number
	newTokenCount: number
	vocabCount: number
	verses: LessonScriptAnalyzedVerse[]
}

export type LessonScriptOverride = {
	source: LexemeSource
	id: string
}

export type LessonScriptOverrideMap = Record<string, LessonScriptOverride>
export type LessonScriptSegmentationOverrides = Record<string, string[]>

function normalizeSegmentationOverrides(
	overrides?: LessonScriptSegmentationOverrides,
): LessonScriptSegmentationOverrides {
	if (!overrides) return {}
	const normalized: LessonScriptSegmentationOverrides = {}
	for (const [verseNumber, parts] of Object.entries(overrides)) {
		if (!Array.isArray(parts)) continue
		const cleaned = parts.map((p) => p.trim()).filter(Boolean)
		if (cleaned.length > 0) normalized[verseNumber] = cleaned
	}
	return Object.fromEntries(
		Object.entries(normalized).sort(
			([a], [b]) => Number.parseInt(a, 10) - Number.parseInt(b, 10),
		),
	)
}

function makeLessonScriptDigest(
	script: string,
	segmentationOverrides: LessonScriptSegmentationOverrides,
): string {
	return createHash('sha256')
		.update(JSON.stringify({ script, segmentationOverrides }))
		.digest('hex')
}

function tokenizeParagraph(paragraph: string): { surface: string; consonants: string }[] {
	const matches = paragraph.match(/[א-ת\u0591-\u05C7׳״]+/g) ?? []
	return matches
		.map((surface) => ({
			surface,
			consonants: normalizeHebrewToConsonants(surface),
		}))
		.filter((token) => token.consonants.length > 0)
}

async function getLexemeMap(): Promise<Map<string, LessonScriptLexemeCandidate[]>> {
	const [biblicalRows, customRows] = await Promise.all([
		db
			.select({
				id: hebrewLexemes.id,
				lemma: hebrewLexemes.lemma,
				consonants: hebrewLexemes.lemma_clean,
			})
			.from(hebrewLexemes),
		db
			.select({
				id: customHebrewLexemes.id,
				lemma: customHebrewLexemes.lemma,
				consonants: customHebrewLexemes.lemmaClean,
			})
			.from(customHebrewLexemes),
	])

	const map = new Map<string, LessonScriptLexemeCandidate[]>()

	for (const row of biblicalRows) {
		if (!row.consonants) continue
		const list = map.get(row.consonants) ?? []
		list.push({
			source: 'BIBLICAL',
			id: row.id,
			lemma: row.lemma,
			consonants: row.consonants,
		})
		map.set(row.consonants, list)
	}

	for (const row of customRows) {
		if (!row.consonants) continue
		const list = map.get(row.consonants) ?? []
		list.push({
			source: 'CUSTOM',
			id: row.id,
			lemma: row.lemma,
			consonants: row.consonants,
		})
		map.set(row.consonants, list)
	}

	return map
}

export async function buildLessonScriptAnalysis(
	script: string,
	segmentationOverrides?: LessonScriptSegmentationOverrides,
): Promise<LessonScriptAnalysis> {
	const paragraphs = splitIntoVerseParagraphs(script)
	const normalizedOverrides = normalizeSegmentationOverrides(segmentationOverrides)
	const lexemeMap = await getLexemeMap()

	const verses: LessonScriptAnalyzedVerse[] = []
	let tokenCount = 0
	let knownTokenCount = 0
	const uniqueConsonants = new Set<string>()

	for (let i = 0; i < paragraphs.length; i++) {
		const verseNumber = i + 1
		const overrideTokens = normalizedOverrides[String(verseNumber)]
		const pieces = overrideTokens
			? overrideTokens
					.map((surface) => ({
						surface,
						consonants: normalizeHebrewToConsonants(surface),
					}))
					.filter((token) => token.consonants.length > 0)
			: tokenizeParagraph(paragraphs[i])

		const tokens: LessonScriptAnalyzedToken[] = pieces.map((piece, index) => {
			const candidates = lexemeMap.get(piece.consonants) ?? []
			const selectedCandidate = candidates[0] ?? null
			tokenCount += 1
			uniqueConsonants.add(piece.consonants)
			if (candidates.length > 0) knownTokenCount += 1

			return {
				tokenKey: `${verseNumber}:${index + 1}`,
				surface: piece.surface,
				consonants: piece.consonants,
				known: candidates.length > 0,
				candidates,
				selectedCandidate,
			}
		})

		verses.push({
			verseNumber,
			text: paragraphs[i],
			tokens,
		})
	}

	return {
		digest: makeLessonScriptDigest(script, normalizedOverrides),
		verseCount: verses.length,
		tokenCount,
		knownTokenCount,
		newTokenCount: tokenCount - knownTokenCount,
		vocabCount: uniqueConsonants.size,
		verses,
	}
}

function getSelectedCandidate(
	token: LessonScriptAnalyzedToken,
	overrides: LessonScriptOverrideMap,
): LessonScriptLexemeCandidate | null {
	const override = overrides[token.tokenKey]
	if (!override) return token.selectedCandidate

	const selected = token.candidates.find(
		(c) => c.source === override.source && c.id === override.id,
	)
	if (!selected) {
		throw new Error(`Invalid override for token ${token.tokenKey}`)
	}
	return selected
}

async function resolveCustomLexeme(
	tx: LessonVocabDb,
	consonants: string,
	surface: string,
): Promise<string> {
	const [existing] = await tx
		.select({ id: customHebrewLexemes.id })
		.from(customHebrewLexemes)
		.where(eq(customHebrewLexemes.lemmaClean, consonants))
		.limit(1)

	if (existing) return existing.id

	const [created] = await tx
		.insert(customHebrewLexemes)
		.values({
			lemma: surface,
			lemmaClean: consonants,
			source: 'CUSTOM',
		})
		.returning({ id: customHebrewLexemes.id })

	return created.id
}

export async function syncLessonScriptVocabulary(
	tx: LessonVocabDb,
	lessonId: string,
	analysis: LessonScriptAnalysis,
	overrides: LessonScriptOverrideMap = {},
) {
	await tx.delete(lessonScriptVocab).where(eq(lessonScriptVocab.lessonId, lessonId))

	const allTokens = analysis.verses.flatMap((verse) => verse.tokens)
	if (allTokens.length === 0) {
		await tx.delete(lessonNewVocab).where(eq(lessonNewVocab.lessonId, lessonId))
		return { vocabCount: 0, tokenCount: 0, customLexemesAdded: 0 }
	}

	const byConsonants = new Map<
		string,
		{
			consonants: string
			surface: string
			frequency: number
			selected: LessonScriptLexemeCandidate | null
		}
	>()

	for (const token of allTokens) {
		const selected = getSelectedCandidate(token, overrides)
		const existing = byConsonants.get(token.consonants)
		if (!existing) {
			byConsonants.set(token.consonants, {
				consonants: token.consonants,
				surface: token.surface,
				frequency: 1,
				selected,
			})
			continue
		}

		existing.frequency += 1
		if (
			selected &&
			existing.selected &&
			(selected.id !== existing.selected.id || selected.source !== existing.selected.source)
		) {
			throw new Error(
				`Conflicting lexeme selections for consonants "${token.consonants}".`,
			)
		}
		if (!existing.selected) existing.selected = selected
	}

	let customLexemesAdded = 0
	const resolvedTerms: Array<{
		consonants: string
		surface: string
		frequency: number
		biblicalLexemeId: string | null
		customLexemeId: string | null
	}> = []

	for (const term of byConsonants.values()) {
		let biblicalLexemeId: string | null = null
		let customLexemeId: string | null = null

		if (term.selected) {
			if (term.selected.source === 'BIBLICAL') biblicalLexemeId = term.selected.id
			if (term.selected.source === 'CUSTOM') customLexemeId = term.selected.id
		} else {
			customLexemeId = await resolveCustomLexeme(tx, term.consonants, term.surface)
			customLexemesAdded += 1
		}

		resolvedTerms.push({
			consonants: term.consonants,
			surface: term.surface,
			frequency: term.frequency,
			biblicalLexemeId,
			customLexemeId,
		})
	}

	await tx
		.insert(lessonVocabTerms)
		.values(
			resolvedTerms.map((term) => ({
				consonants: term.consonants,
				surface: term.surface,
				biblicalLexemeId: term.biblicalLexemeId,
				customLexemeId: term.customLexemeId,
			})),
		)
		.onConflictDoNothing({ target: lessonVocabTerms.consonants })

	for (const term of resolvedTerms) {
		await tx
			.update(lessonVocabTerms)
			.set({
				surface: term.surface,
				biblicalLexemeId: term.biblicalLexemeId,
				customLexemeId: term.customLexemeId,
			})
			.where(eq(lessonVocabTerms.consonants, term.consonants))
	}

	const consonants = resolvedTerms.map((term) => term.consonants)
	const termRows = await tx
		.select({
			id: lessonVocabTerms.id,
			consonants: lessonVocabTerms.consonants,
		})
		.from(lessonVocabTerms)
		.where(inArray(lessonVocabTerms.consonants, consonants))

	const termIdByConsonants = new Map(termRows.map((row) => [row.consonants, row.id]))

	const lessonRows = resolvedTerms
		.map((term) => {
			const vocabTermId = termIdByConsonants.get(term.consonants)
			if (!vocabTermId) return null
			return {
				lessonId,
				vocabTermId,
				surfaceInScript: term.surface,
				frequency: term.frequency,
			}
		})
		.filter(Boolean) as Array<{
		lessonId: string
		vocabTermId: string
		surfaceInScript: string
		frequency: number
	}>

	if (lessonRows.length > 0) {
		await tx.insert(lessonScriptVocab).values(lessonRows)
	}

	const validTermIds = lessonRows.map((row) => row.vocabTermId)
	if (validTermIds.length > 0) {
		await tx
			.delete(lessonNewVocab)
			.where(
				and(
					eq(lessonNewVocab.lessonId, lessonId),
					notInArray(lessonNewVocab.vocabTermId, validTermIds),
				),
			)
	} else {
		await tx.delete(lessonNewVocab).where(eq(lessonNewVocab.lessonId, lessonId))
	}

	return {
		vocabCount: lessonRows.length,
		tokenCount: analysis.tokenCount,
		customLexemesAdded,
	}
}

