import { NextResponse } from 'next/server'
import {
	hebrewBooks,
	hebrewChapters,
	hebrewVerses,
	hebrewWords,
	supabaseDb as db,
} from '@/db'

// Load JSON from Supabase Storage
async function load(name: string) {
	const url = `https://wsdmzszpqaxeftyebiqg.supabase.co/storage/v1/object/public/seed/${name}.json`
	const res = await fetch(url)

	if (!res.ok) throw new Error(`Failed to load ${name}.json`)
	return res.json()
}

// Micro-batch insert helper
async function insertInBatches(table: any, rows: any[], batchSize = 500) {
	for (let i = 0; i < rows.length; i += batchSize) {
		const batch = rows.slice(i, i + batchSize)
		await db.insert(table).values(batch)
		console.log(`Inserted ${i + batch.length} / ${rows.length}`)
	}
}

export async function GET() {
	try {
		console.log('Loading books, chapters, verses…')

		const books = await load('books')
		const chapters = await load('chapters')
		const verses = await load('verses')

		console.log('Inserting books…')
		await insertInBatches(hebrewBooks, books, 200)

		console.log('Inserting chapters…')
		await insertInBatches(hebrewChapters, chapters, 500)

		console.log('Inserting verses…')
		await insertInBatches(hebrewVerses, verses, 500)

		// --------------------------------------------
		// Load WORD CHUNKS
		// --------------------------------------------
		const wordFiles = [
			'hebrew_words_0',
			'hebrew_words_1',
			'hebrew_words_2',
			'hebrew_words_3',
			'hebrew_words_4',
			'hebrew_words_5',
			'hebrew_words_6',
			'hebrew_words_7',
			'hebrew_words_8',
			'hebrew_words_9',
			'hebrew_words_10',
			'hebrew_words_11',
			'hebrew_words_12',
			'hebrew_words_13',
			'hebrew_words_14',
			'hebrew_words_15',
			'hebrew_words_16',
			'hebrew_words_17',
			'hebrew_words_18',
			'hebrew_words_19',
			'hebrew_words_20',
			'hebrew_words_21',
		]

		console.log(`Starting word insert (${wordFiles.length} chunks)…`)

		for (let f = 0; f < wordFiles.length; f++) {
			const file = wordFiles[f]
			console.log(`Loading chunk ${f + 1}/${wordFiles.length}: ${file}.json`)
			const chunk = await load(file)

			console.log(
				`Inserting ${chunk.length} words from ${file} in micro-batches…`
			)

			// Words require the smallest batches (heavy rows)
			await insertInBatches(hebrewWords, chunk, 400)
		}

		console.log('All seeded successfully!')
		return NextResponse.json({ status: 'done' })
	} catch (err: any) {
		console.error('SEED ERROR:', err)
		return NextResponse.json({ error: err.message }, { status: 500 })
	}
}
