// db/queries/hebrew-reader.ts
import { supabaseDb as db } from '@/db/client'
import { eq, and, sql, InferSelectModel, count } from 'drizzle-orm'
import {
	hebrewBooks,
	hebrewChapters,
	hebrewLexemes,
	hebrewVerses,
	hebrewWords,
} from '../schema'

export type HebrewBook = InferSelectModel<typeof hebrewBooks>

// 1. find bookId by name
export async function getBookId(bookName: string) {
	return (
		(
			await db.query.hebrewBooks.findFirst({
				where: sql`LOWER(${hebrewBooks.name}) = LOWER(${bookName})`,
			})
		)?.id ?? null
	)
}

// 2. find chapterId by bookId + chapterNumber
export async function getChapterId(bookId: number, chapterNumber: number) {
	const chapter = await db.query.hebrewChapters.findFirst({
		where: and(
			eq(hebrewChapters.bookId, bookId),
			eq(hebrewChapters.chapterNumber, chapterNumber)
		),
	})
	return chapter?.id ?? null
}

// 3. fetch all words in chapter
export async function getWordsForChapter(chapterId: string) {
	return db
		.select()
		.from(hebrewWords)
		.where(eq(hebrewWords.chapterId, chapterId))
		.orderBy(
			// verse number from "1-1-15" → 15
			sql`split_part(${hebrewWords.verseId}, '-', 3)::int`,
			// then position in verse
			hebrewWords.wordSeq
		)
}

// 4. get all chapter numbers for a book
export async function getChaptersForBook(bookName: string) {
	const book = await db.query.hebrewBooks.findFirst({
		where: sql`LOWER(${hebrewBooks.name}) = LOWER(${bookName})`,
	})

	if (!book) return []

	const chapters = await db.query.hebrewChapters.findMany({
		where: eq(hebrewChapters.bookId, book.id),
		orderBy: [hebrewChapters.chapterNumber],
	})

	return chapters.map((c) => c.chapterNumber)
}

// Get all books ordered by their canonical order
export async function getAllBooks() {
	return db.query.hebrewBooks.findMany({
		orderBy: [hebrewBooks.id], // or sequence column
	})
}

export function normalizeBookName(name: string): string {
	return name
		.trim()
		.toLowerCase()
		.replace(/\s+/g, '_') // spaces → underscores
		.replace(/-+/g, '_') // dashes → underscores
		.replace(/[()]/g, '') // remove parens
}

export function formatBookTitle(name: string): string {
	return name
		.replace(/_/g, ' ') // underscores → spaces
		.replace(/\s+/g, ' ') // collapse double spaces
		.trim()
		.replace(/\b(\d+)\s+(\w)/, '$1 $2') // ensure “1 Kings” not “1kings”
		.replace(/\b\w/g, (c) => c.toUpperCase()) // capitalize words
}

export function dbNameFromSlug(slug: string): string {
	return slug
		.split('_')
		.map((part) =>
			Number(part) ? part : part.charAt(0).toUpperCase() + part.slice(1)
		)
		.join('_')
}

/* **********************************************
 *  DICTIONARY QUERIES (NEW)
 * **********************************************/

/**
 * Fetch all words in a book by bookId.
 * Includes chapter + verse relations.
 */
export async function getWordsForBookById(bookId: number) {
	return (
		db
			.select({
				id: hebrewWords.id,
				surface: hebrewWords.surface,
				lemma: hebrewWords.lemma,
				lemmaVocalized: hebrewWords.lemmaVocalized,
				partOfSpeech: hebrewWords.partOfSpeech,
				wordSeq: hebrewWords.wordSeq,

				// ⭐ Correct lexeme fields
				glossEnglish: hebrewLexemes.glossEnglish,
				glossTbesh: hebrewLexemes.glossTbesh,
				meaningTbesh: hebrewLexemes.meaningTbesh,
				frequency: hebrewLexemes.frequency,

				// Location
				chapterNumber: hebrewChapters.chapterNumber,
				verseNumber: hebrewVerses.verseNumber,
			})
			.from(hebrewWords)

			// chapter + verse
			.leftJoin(hebrewChapters, eq(hebrewChapters.id, hebrewWords.chapterId))
			.leftJoin(hebrewVerses, eq(hebrewVerses.id, hebrewWords.verseId))

			// 🔥 THE ONLY CORRECT JOIN
			.leftJoin(hebrewLexemes, eq(hebrewLexemes.id, hebrewWords.lexemeId))

			.where(eq(hebrewWords.bookId, bookId))

			.orderBy(
				sql`split_part(${hebrewWords.chapterId}, '-', 2)::int`,
				sql`split_part(${hebrewWords.verseId}, '-', 3)::int`,
				hebrewWords.wordSeq
			)
	)
}

/**
 * Fetch all words for a given book name.
 * Case-insensitive match on book name.
 */
export async function getWordsForBook(bookName: string) {
	const book = await db.query.hebrewBooks.findFirst({
		where: sql`LOWER(${hebrewBooks.name}) = LOWER(${bookName})`,
	})

	if (!book) return []

	const raw = await getWordsForBookById(book.id)

	return raw.map((w) => ({
		id: w.id,
		surface: w.surface,
		lemma: w.lemma,
		lemmaVocalized: w.lemmaVocalized,
		partOfSpeech: w.partOfSpeech,
		wordSeq: w.wordSeq,

		glossEnglish: w.glossEnglish,
		glossTbesh: w.glossTbesh,
		meaningTbesh: w.meaningTbesh,
		frequency: w.frequency,

		chapter: { chapterNumber: w.chapterNumber ?? 0 },
		verse: { verseNumber: w.verseNumber ?? 0 },
	}))
}

/**
 * Get list of chapters for a book (used for sidebar or select menus)
 */
export async function getBookChapters(bookId: number) {
	return db.query.hebrewChapters.findMany({
		where: eq(hebrewChapters.bookId, bookId),
		orderBy: [hebrewChapters.chapterNumber],
	})
}

export async function getBookById(bookId: number) {
	return db.query.hebrewBooks.findFirst({
		where: eq(hebrewBooks.id, bookId),
	})
}
