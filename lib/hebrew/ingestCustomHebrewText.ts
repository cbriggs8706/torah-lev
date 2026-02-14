import { createHash } from 'crypto'
import { and, eq, not, isNull } from 'drizzle-orm'
import { supabaseDb as db } from '@/db'
import { customHebrewBooks } from '@/db/schema/tables/custom_hebrew_books'
import { customHebrewChapters } from '@/db/schema/tables/custom_hebrew_chapters'
import { customHebrewVerses } from '@/db/schema/tables/custom_hebrew_verses'
import { customHebrewWords } from '@/db/schema/tables/custom_hebrew_words'
import { customHebrewLexemes } from '@/db/schema/tables/custom_hebrew_lexemes'
import { customHebrewIngestAudits } from '@/db/schema/tables/custom_hebrew_ingest_audits'
import { hebrewLexemes } from '@/db/schema/tables/hebrew_lexemes'
import { hebrewVerses } from '@/db/schema/tables/hebrew_verses'
import { hebrewWords } from '@/db/schema/tables/hebrew_words'
import { segmentHebrewWordHybrid } from './segmentHebrewWordHybrid'

export type LexemeSource = 'BIBLICAL' | 'CUSTOM'

export interface LexemeCandidate {
	source: LexemeSource
	id: string
	lemma: string
	consonants: string
}

export interface AnalyzedToken {
	tokenKey: string
	surface: string
	consonants: string
	known: boolean
	candidates: LexemeCandidate[]
	selectedCandidate: LexemeCandidate | null
}

export interface AnalyzedVerse {
	verseNumber: number
	text: string
	tokens: AnalyzedToken[]
}

export interface IngestAnalysis {
	digest: string
	exactBibleMatch: boolean
	linkedHebrewBookId: number | null
	verseCount: number
	tokenCount: number
	knownTokenCount: number
	newTokenCount: number
	verses: AnalyzedVerse[]
}

export interface IngestOverride {
	source: LexemeSource
	id: string
}

export type IngestOverrideMap = Record<string, IngestOverride>
export type SegmentationOverrides = Record<string, string[]>

export function stripNiqqud(str: string): string {
	return str.replace(/[\u0591-\u05C7]/g, '')
}

export function normalizeHebrewToConsonants(str: string): string {
	return stripNiqqud(
		str
			.normalize('NFKD')
			.replace(/[\u05BD\u05BF\u05C4\u05C5]/g, '')
			.normalize('NFC')
	)
		.replace(/[^א-ת]/g, '')
		.trim()
}

export function splitIntoVerseParagraphs(rawText: string): string[] {
	return rawText
		.split(/\r?\n\s*\r?\n/)
		.map((s) => s.trim())
		.filter(Boolean)
}

function tokenizeParagraph(
	paragraph: string,
	lexemeMap: Map<string, LexemeCandidate[]>
): { surface: string; consonants: string }[] {
	const words = paragraph
		.split(/\s+/)
		.map((w) => w.trim())
		.filter(Boolean)

	const out: { surface: string; consonants: string }[] = []

	for (const word of words) {
		const initialSegments = segmentHebrewWordHybrid(word)
		let segments = initialSegments

		// If segmentation over-splits a known standalone lexeme (e.g. כֶּבֶשׂ),
		// keep the recombined form as a single token.
		if (initialSegments.length > 1) {
			const recombinedSurface = initialSegments.join('')
			const recombinedCons = normalizeHebrewToConsonants(recombinedSurface)
			if (recombinedCons && (lexemeMap.get(recombinedCons)?.length ?? 0) > 0) {
				segments = [recombinedSurface]
			}
		}

		for (const seg of segments) {
			const consonants = normalizeHebrewToConsonants(seg)
			if (!consonants) continue
			out.push({ surface: seg, consonants })
		}
	}

	return out
}

function makeDigest(input: {
	customHebrewBookId: number
	chapterNumber: number
	verses: string[]
	segmentationOverrides: SegmentationOverrides
}): string {
	return createHash('sha256').update(JSON.stringify(input)).digest('hex')
}

function normalizeSegmentationOverrides(
	overrides?: SegmentationOverrides
): SegmentationOverrides {
	if (!overrides) return {}

	const normalized: SegmentationOverrides = {}
	for (const [verseNumber, parts] of Object.entries(overrides)) {
		if (!Array.isArray(parts)) continue
		const cleaned = parts.map((p) => p.trim()).filter(Boolean)
		if (cleaned.length > 0) normalized[verseNumber] = cleaned
	}

	return Object.fromEntries(
		Object.entries(normalized).sort(
			([a], [b]) => Number.parseInt(a, 10) - Number.parseInt(b, 10)
		)
	)
}

async function getLexemeMaps() {
	const biblicalRows = await db
		.select({
			id: hebrewLexemes.id,
			lemma: hebrewLexemes.lemma,
			consonants: hebrewLexemes.lemma_clean,
		})
		.from(hebrewLexemes)
		.where(not(isNull(hebrewLexemes.lemma_clean)))

	const customRows = await db
		.select({
			id: customHebrewLexemes.id,
			lemma: customHebrewLexemes.lemma,
			consonants: customHebrewLexemes.lemmaClean,
		})
		.from(customHebrewLexemes)
		.where(not(isNull(customHebrewLexemes.lemmaClean)))

	const map = new Map<string, LexemeCandidate[]>()

	for (const row of biblicalRows) {
		if (!row.consonants) continue
		const candidates = map.get(row.consonants) ?? []
		candidates.push({
			source: 'BIBLICAL',
			id: row.id,
			lemma: row.lemma,
			consonants: row.consonants,
		})
		map.set(row.consonants, candidates)
	}

	for (const row of customRows) {
		if (!row.consonants) continue
		const candidates = map.get(row.consonants) ?? []
		candidates.push({
			source: 'CUSTOM',
			id: row.id,
			lemma: row.lemma,
			consonants: row.consonants,
		})
		map.set(row.consonants, candidates)
	}

	return map
}

async function getExactBibleChapterMatch(
	linkedHebrewBookId: number | null,
	chapterNumber: number,
	paragraphs: string[]
): Promise<boolean> {
	if (!linkedHebrewBookId) return false

	const chapterId = `${linkedHebrewBookId}-${chapterNumber}`

	const verses = await db
		.select({ id: hebrewVerses.id, verseNumber: hebrewVerses.verseNumber })
		.from(hebrewVerses)
		.where(
			and(
				eq(hebrewVerses.bookId, linkedHebrewBookId),
				eq(hebrewVerses.chapterId, chapterId)
			)
		)

	if (verses.length === 0) return false

	const words = await db
		.select({
			verseId: hebrewWords.verseId,
			wordSeq: hebrewWords.wordSeq,
			surface: hebrewWords.surface,
		})
		.from(hebrewWords)
		.where(
			and(eq(hebrewWords.bookId, linkedHebrewBookId), eq(hebrewWords.chapterId, chapterId))
		)

	const byVerse = new Map<string, { wordSeq: number; surface: string }[]>()
	for (const word of words) {
		const list = byVerse.get(word.verseId) ?? []
		list.push({ wordSeq: word.wordSeq, surface: word.surface })
		byVerse.set(word.verseId, list)
	}

	const bibleNormalized = verses
		.sort((a, b) => a.verseNumber - b.verseNumber)
		.map((verse) => {
			const text = (byVerse.get(verse.id) ?? [])
				.sort((a, b) => a.wordSeq - b.wordSeq)
				.map((w) => w.surface)
				.join(' ')
			return normalizeHebrewToConsonants(text)
		})

	const customNormalized = paragraphs.map((p) => normalizeHebrewToConsonants(p))

	if (bibleNormalized.length !== customNormalized.length) return false

	for (let i = 0; i < customNormalized.length; i++) {
		if (customNormalized[i] !== bibleNormalized[i]) return false
	}

	return true
}

export async function buildCustomHebrewIngestAnalysis({
	customHebrewBookId,
	chapterNumber,
	rawText,
	segmentationOverrides,
}: {
	customHebrewBookId: number
	chapterNumber: number
	rawText: string
	segmentationOverrides?: SegmentationOverrides
}): Promise<IngestAnalysis> {
	const paragraphs = splitIntoVerseParagraphs(rawText)
	const lexemeMap = await getLexemeMaps()
	const normalizedSegmentationOverrides = normalizeSegmentationOverrides(
		segmentationOverrides
	)

	const book = await db
		.select({ linkedHebrewBookId: customHebrewBooks.linkedHebrewBookId })
		.from(customHebrewBooks)
		.where(eq(customHebrewBooks.id, customHebrewBookId))
		.limit(1)

	const linkedHebrewBookId = book[0]?.linkedHebrewBookId ?? null

	const verses: AnalyzedVerse[] = []
	let tokenCount = 0
	let knownTokenCount = 0

	for (let i = 0; i < paragraphs.length; i++) {
		const verseNumber = i + 1
		const overrideParts = normalizedSegmentationOverrides[String(verseNumber)]
		const pieces = overrideParts
			? overrideParts
					.map((surface) => ({
						surface,
						consonants: normalizeHebrewToConsonants(surface),
					}))
					.filter((p) => p.consonants.length > 0)
			: tokenizeParagraph(paragraphs[i], lexemeMap)
		const tokens: AnalyzedToken[] = []

		for (let j = 0; j < pieces.length; j++) {
			const tokenKey = `${verseNumber}:${j + 1}`
			const candidates = lexemeMap.get(pieces[j].consonants) ?? []
			const selectedCandidate = candidates[0] ?? null

			tokens.push({
				tokenKey,
				surface: pieces[j].surface,
				consonants: pieces[j].consonants,
				known: candidates.length > 0,
				candidates,
				selectedCandidate,
			})

			tokenCount++
			if (candidates.length > 0) knownTokenCount++
		}

		verses.push({
			verseNumber,
			text: paragraphs[i],
			tokens,
		})
	}

	const exactBibleMatch = await getExactBibleChapterMatch(
		linkedHebrewBookId,
		chapterNumber,
		paragraphs
	)

	return {
		digest: makeDigest({
			customHebrewBookId,
			chapterNumber,
			verses: paragraphs,
			segmentationOverrides: normalizedSegmentationOverrides,
		}),
		exactBibleMatch,
		linkedHebrewBookId,
		verseCount: verses.length,
		tokenCount,
		knownTokenCount,
		newTokenCount: tokenCount - knownTokenCount,
		verses,
	}
}

async function resolveCustomLexeme(consonants: string, surface: string): Promise<string> {
	const [existing] = await db
		.select({ id: customHebrewLexemes.id })
		.from(customHebrewLexemes)
		.where(eq(customHebrewLexemes.lemmaClean, consonants))
		.limit(1)

	if (existing) return existing.id

	const [inserted] = await db
		.insert(customHebrewLexemes)
		.values({
			lemma: surface,
			lemmaClean: consonants,
			source: 'CUSTOM',
		})
		.returning({ id: customHebrewLexemes.id })

	return inserted.id
}

function getSelectedCandidate(
	token: AnalyzedToken,
	overrides: IngestOverrideMap
): LexemeCandidate | null {
	const override = overrides[token.tokenKey]
	if (!override) return token.selectedCandidate

	const selected = token.candidates.find(
		(c) => c.id === override.id && c.source === override.source
	)

	if (!selected) {
		throw new Error(`Invalid override for token ${token.tokenKey}`)
	}

	return selected
}

export async function ingestCustomHebrewText({
	customHebrewBookId,
	chapterNumber,
	rawText,
	actorUserId,
	analysisDigest,
	overrides,
	segmentationOverrides,
}: {
	customHebrewBookId: number
	chapterNumber: number
	rawText: string
	actorUserId?: string
	analysisDigest: string
	overrides?: IngestOverrideMap
	segmentationOverrides?: SegmentationOverrides
}) {
	const parsedOverrides = overrides ?? {}
	const analysis = await buildCustomHebrewIngestAnalysis({
		customHebrewBookId,
		chapterNumber,
		rawText,
		segmentationOverrides,
	})

	if (analysis.digest !== analysisDigest) {
		throw new Error('Analysis digest mismatch. Re-run Analyze before importing.')
	}

	const overrideCount = Object.keys(parsedOverrides).length

	if (analysis.exactBibleMatch) {
		await db.insert(customHebrewIngestAudits).values({
			customHebrewBookId,
			chapterNumber,
			actorUserId,
			status: 'SKIPPED_EXACT_MATCH',
			exactBibleMatch: true,
			verseCount: analysis.verseCount,
			tokenCount: analysis.tokenCount,
			knownTokenCount: analysis.knownTokenCount,
			newTokenCount: analysis.newTokenCount,
			overrideCount,
			summary: 'Chapter matches linked biblical text exactly; import skipped.',
		})

		return {
			skipped: true,
			status: 'SKIPPED_EXACT_MATCH' as const,
			verseCount: analysis.verseCount,
			tokenCount: analysis.tokenCount,
			knownTokenCount: analysis.knownTokenCount,
			newTokenCount: analysis.newTokenCount,
			overrideCount,
		}
	}

	const chapterId = `${customHebrewBookId}-${chapterNumber}`

	await db.transaction(async (tx) => {
		await tx
			.insert(customHebrewChapters)
			.values({
				id: chapterId,
				bookId: customHebrewBookId,
				chapterNumber,
			})
			.onConflictDoNothing()

		await tx.delete(customHebrewWords).where(eq(customHebrewWords.chapterId, chapterId))
		await tx.delete(customHebrewVerses).where(eq(customHebrewVerses.chapterId, chapterId))

		for (const verse of analysis.verses) {
			const verseId = `${customHebrewBookId}-${chapterNumber}-${verse.verseNumber}`

			await tx.insert(customHebrewVerses).values({
				id: verseId,
				bookId: customHebrewBookId,
				chapterId,
				chapterNumber,
				verseNumber: verse.verseNumber,
			})

			for (let i = 0; i < verse.tokens.length; i++) {
				const token = verse.tokens[i]
				const selected = getSelectedCandidate(token, parsedOverrides)
				const wordId = `${customHebrewBookId}-${chapterNumber}-${verse.verseNumber}-${i + 1}`

				let lexemeId: string | null = null
				let customLexemeId: string | null = null

				if (selected) {
					if (selected.source === 'BIBLICAL') {
						lexemeId = selected.id
					} else {
						customLexemeId = selected.id
					}
				} else {
					customLexemeId = await resolveCustomLexeme(token.consonants, token.surface)
				}

				await tx.insert(customHebrewWords).values({
					id: wordId,
					bookId: customHebrewBookId,
					chapterId,
					verseId,
					wordSeq: i + 1,
					surface: token.surface,
					consonants: token.consonants,
					lexemeId,
					customLexemeId,
				})
			}
		}

		await tx.insert(customHebrewIngestAudits).values({
			customHebrewBookId,
			chapterNumber,
			actorUserId,
			status: 'IMPORTED',
			exactBibleMatch: false,
			verseCount: analysis.verseCount,
			tokenCount: analysis.tokenCount,
			knownTokenCount: analysis.knownTokenCount,
			newTokenCount: analysis.newTokenCount,
			overrideCount,
			summary: 'Imported custom chapter successfully.',
		})
	})

	return {
		skipped: false,
		status: 'IMPORTED' as const,
		verseCount: analysis.verseCount,
		tokenCount: analysis.tokenCount,
		knownTokenCount: analysis.knownTokenCount,
		newTokenCount: analysis.newTokenCount,
		overrideCount,
	}
}
