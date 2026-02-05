import 'dotenv/config'
import db from '@/db/drizzle'
import { flashcardUserState, users } from '@/db/schema'

import awbHebrewVocab from '@/lib/data/vocab/awbVocab.json'
import hsVocab from '@/lib/data/vocab/hsVocab.json'
import abcHebrewVocab from '@/lib/data/vocab/abcVocab.json'
import type { HebrewVocab } from '@/lib/vocab'

type FlashcardSeed = {
	cardId: number
	courseId: number
	language: string
}

const HEBREW_SETS: { courseId: number; data: HebrewVocab[] }[] = [
	{ courseId: 6, data: awbHebrewVocab as HebrewVocab[] },
	{ courseId: 11, data: hsVocab as HebrewVocab[] },
	{ courseId: 14, data: abcHebrewVocab as HebrewVocab[] },
]

function chunk<T>(items: T[], size: number): T[][] {
	const chunks: T[][] = []
	for (let i = 0; i < items.length; i += size) {
		chunks.push(items.slice(i, i + size))
	}
	return chunks
}

function collectSeeds(): FlashcardSeed[] {
	const seen = new Set<string>()
	const seeds: FlashcardSeed[] = []

	for (const set of HEBREW_SETS) {
		for (const card of set.data) {
			if (card.id == null) continue
			const key = `${set.courseId}:${card.id}:he`
			if (seen.has(key)) continue
			seen.add(key)
			seeds.push({ cardId: card.id, courseId: set.courseId, language: 'he' })
		}
	}

	return seeds
}

async function main() {
	const seedCards = collectSeeds()
	if (seedCards.length === 0) {
		console.log('No flashcard seeds found.')
		return
	}

	const userRows = await db.select({ id: users.id }).from(users)
	if (userRows.length === 0) {
		console.log('No users found.')
		return
	}

	const now = new Date()
	const chunkSize = 1000

	for (const user of userRows) {
		const rows = seedCards.map((seed) => ({
			userId: user.id,
			cardId: seed.cardId,
			courseId: seed.courseId,
			language: seed.language,
			dueAt: now,
			state: 'new' as const,
			learningStep: 0,
			ease: 2.5,
			intervalDays: 0,
			reps: 0,
			lapses: 0,
			leech: false,
		}))

		const batches = chunk(rows, chunkSize)
		for (const batch of batches) {
			await db
				.insert(flashcardUserState)
				.values(batch)
				.onConflictDoNothing()
		}
	}

	console.log(
		`Backfill complete. Users: ${userRows.length}, cards: ${seedCards.length}`
	)
}

main().catch((err) => {
	console.error(err)
	process.exit(1)
})
