// app/actions/ingest-hebrew-chapter.ts
'use server'

import { supabaseDb as db } from '@/db'
import { hebrewChapters, hebrewVerses, hebrewWords } from '@/db/schema'
import { tokenizeHebrew } from '@/lib/hebrew/tokenize'
import { analyzeHebrewWord } from '@/lib/hebrew/analyze'
import { eq } from 'drizzle-orm'

export async function ingestHebrewChapter({
	bookId,
	chapterNumber,
	text,
}: {
	bookId: number
	chapterNumber: number
	text: string
}) {
	const chapterId = `${bookId}-${chapterNumber}`

	// 1. Create or overwrite chapter entry
	const existingChapter = await db.query.hebrewChapters.findFirst({
		where: eq(hebrewChapters.id, chapterId),
	})

	if (!existingChapter) {
		await db.insert(hebrewChapters).values({
			id: chapterId,
			bookId,
			chapterNumber,
		})
	}

	// 2. Remove old verses + words (fresh upload)
	await db.delete(hebrewVerses).where(eq(hebrewVerses.chapterId, chapterId))
	await db.delete(hebrewWords).where(eq(hebrewWords.chapterId, chapterId))

	// 3. Split paragraphs = verses
	const verses = text
		.trim()
		.split(/\n\s*\n/) // paragraphs
		.map((v) => v.trim())
		.filter(Boolean)

	let verseNumber = 1

	for (const verseText of verses) {
		const verseId = `${chapterId}-${verseNumber}`

		await db.insert(hebrewVerses).values({
			id: verseId,
			bookId,
			chapterId,
			chapterNumber,
			verseNumber,
		})

		const words = tokenizeHebrew(verseText)

		let wordSeq = 1

		for (const surface of words) {
			const analysis = analyzeHebrewWord(surface)

			const wordId = `${verseId}-${wordSeq}`

			await db.insert(hebrewWords).values({
				id: wordId,
				bookId,
				chapterId,
				verseId,
				wordSeq,
				surface,
				lemma: analysis.lemma,
				lemmaVocalized: analysis.lemmaVocalized,
				partOfSpeech: analysis.partOfSpeech,
				verbStem: analysis.verbStem,
				verbTense: analysis.verbTense,
			})

			wordSeq++
		}

		verseNumber++
	}

	return { message: 'Chapter processed successfully!' }
}
