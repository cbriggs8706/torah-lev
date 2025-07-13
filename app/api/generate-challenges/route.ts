import { NextResponse } from 'next/server'
import db from '@/db/drizzle'
import { challenges, challengeOptions } from '@/db/schema'
import flashcards from '@/lib/data/vocab/flashcards.json'

type ChallengeType =
	| 'AUDIO-VISUAL'
	| 'AUDIO-TEXT'
	| 'VISUAL-AUDIO'
	| 'VISUAL-TEXT'
	| 'TEXT-AUDIO'
	| 'TEXT-VISUAL'

export const POST = async (req: Request) => {
	const { lessonId, type } = (await req.json()) as {
		lessonId: number
		type: ChallengeType
	}

	const lessonKey = `awb${lessonId}`
	const lessonWords = flashcards.filter((w) =>
		w.lessons.map((l) => l.toLowerCase()).includes(lessonKey.toLowerCase())
	)

	if (!lessonWords.length) {
		return new NextResponse('No words found for lesson', { status: 404 })
	}

	const getPrompt = (word: any) => {
		switch (type) {
			case 'AUDIO-VISUAL':
			case 'AUDIO-TEXT':
				return word.hebAudio
			case 'VISUAL-AUDIO':
			case 'VISUAL-TEXT':
				return word.images?.[0]
			case 'TEXT-AUDIO':
			case 'TEXT-VISUAL':
				return word.heb
		}
	}

	const getOptionValue = (
		word: any
	): {
		text: string
		imageSrc?: string
		audioSrc?: string
	} => {
		switch (type) {
			case 'AUDIO-VISUAL':
				return {
					text: word.heb ?? '', // REQUIRED
					imageSrc: word.images?.[0],
				}
			case 'TEXT-VISUAL':
				return {
					text: word.heb,
					imageSrc: word.images?.[0],
				}
			case 'VISUAL-AUDIO':
				return {
					text: word.heb,
					audioSrc: word.hebAudio,
				}
			case 'TEXT-AUDIO':
				return {
					text: word.heb,
					audioSrc: word.hebAudio,
				}
			case 'AUDIO-TEXT':
			case 'VISUAL-TEXT':
				return {
					text: word.heb,
				}
			default:
				return {
					text: word.heb,
				}
		}
	}

	for (let i = 0; i < lessonWords.length; i++) {
		const word = lessonWords[i]
		const challengeOrder = i + 1
		const prompt = getPrompt(word)
		const transliteration = word.engTransliteration ?? 'unknown'
		const question = `AwB${lessonId}.${challengeOrder} ${transliteration}`

		const challenge = await db
			.insert(challenges)
			.values({
				lessonId,
				type,
				order: challengeOrder,
				question,
			})
			.returning()

		const challengeId = challenge[0].id

		await db.insert(challengeOptions).values({
			challengeId,
			correct: true,
			...getOptionValue(word),
		})

		const distractors = lessonWords
			.filter((w) => w.id !== word.id)
			.sort(() => 0.5 - Math.random())
			.slice(0, 5)

		await Promise.all(
			distractors.map((d) =>
				db.insert(challengeOptions).values({
					challengeId,
					correct: false,
					...getOptionValue(d),
				})
			)
		)
	}

	return NextResponse.json({ message: 'Challenges created successfully!' })
}
