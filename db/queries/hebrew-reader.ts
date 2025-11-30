// db/queries/hebrew-reader.ts
import { supabaseDb as db } from '@/db/client'
import { eq, and, sql } from 'drizzle-orm'
import { hebrewBooks, hebrewChapters, hebrewWords } from '../schema'

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
	return db.query.hebrewWords.findMany({
		where: eq(hebrewWords.chapterId, chapterId),
		orderBy: [hebrewWords.wordSeq],
	})
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
	return db.query.hebrewWords.findMany({
		where: eq(hebrewWords.bookId, bookId),
		with: {
			chapter: true,
			verse: true,
		},
		orderBy: (w, { asc }) => [asc(w.chapterId), asc(w.verseId), asc(w.wordSeq)],
	})
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

	return getWordsForBookById(book.id)
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
