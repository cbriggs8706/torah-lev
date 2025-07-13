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

	// 🔍 STEP 1: Get the lesson title
	const lesson = await db.query.lessons.findFirst({
		where: (l, { eq }) => eq(l.id, lessonId),
	})

	if (!lesson) {
		return new NextResponse('Lesson not found', { status: 404 })
	}

	// 🧠 STEP 2: Extract AwB number from title like "AwB 21: Whatever"
	const awbMatch = lesson.title.match(/AwB\s*(\d+)/i)
	const awbNumber = awbMatch ? awbMatch[1] : '???' // fallback if it doesn't match

	const hasRequiredFields = (word: any): boolean => {
		switch (type) {
			case 'AUDIO-VISUAL':
				return !!word.hebAudio && !!word.images?.[0]
			case 'AUDIO-TEXT':
				return !!word.hebAudio
			case 'VISUAL-AUDIO':
				return !!word.images?.[0] && !!word.hebAudio
			case 'VISUAL-TEXT':
				return !!word.images?.[0]
			case 'TEXT-AUDIO':
				return !!word.hebNiqqud && !!word.hebAudio
			case 'TEXT-VISUAL':
				return !!word.hebNiqqud && !!word.images?.[0]
			default:
				return false
		}
	}

	const lessonKey = `awb${awbNumber}`
	const lessonWords = flashcards.filter(
		(w) =>
			w.lessons.map((l) => l.toLowerCase()).includes(lessonKey.toLowerCase()) &&
			hasRequiredFields(w)
	)

	if (!lessonWords.length) {
		return new NextResponse('No words found for lesson', { status: 404 })
	}

	if (lessonWords.length < 6) {
		return new NextResponse(
			`Not enough valid words (${lessonWords.length}) for challenge type ${type}`,
			{ status: 400 }
		)
	}

	const getPrompt = (word: any): { image?: string; audio?: string } => {
		switch (type) {
			case 'AUDIO-VISUAL':
			case 'AUDIO-TEXT':
				return { audio: word.hebAudio ? `/${word.hebAudio}` : undefined }
			case 'VISUAL-AUDIO':
			case 'VISUAL-TEXT':
				return { image: word.images?.[0] }
			case 'TEXT-AUDIO':
				return { audio: word.hebAudio ? `/${word.hebAudio}` : undefined }
			case 'TEXT-VISUAL':
				return { image: word.images?.[0] }
			default:
				return {}
		}
	}

	const getOptionValue = (
		word: any
	): {
		text: string // always required
		imageSrc?: string
		audioSrc?: string
	} => {
		const fallbackText = word.engTransliteration ?? '[missing]'

		switch (type) {
			case 'AUDIO-VISUAL':
				return {
					text: fallbackText, // required for schema
					imageSrc: word.images?.[0],
				}
			case 'TEXT-VISUAL':
				return {
					text: fallbackText,
					imageSrc: word.images?.[0],
				}
			case 'VISUAL-AUDIO':
				return {
					text: fallbackText,
					audioSrc: word.hebAudio,
				}
			case 'TEXT-AUDIO':
				return {
					text: fallbackText,
					audioSrc: word.hebAudio,
				}
			case 'AUDIO-TEXT':
			case 'VISUAL-TEXT':
				return {
					text: fallbackText,
				}
			default:
				return {
					text: fallbackText,
				}
		}
	}

	for (let i = 0; i < lessonWords.length; i++) {
		const word = lessonWords[i]
		const challengeOrder = i + 3
		const { audio, image } = getPrompt(word)
		const transliteration = word.engTransliteration ?? 'unknown'

		// 🏷️ Correctly formatted title
		const question = `AwB${awbNumber}.${challengeOrder} ${transliteration}`

		const challenge = await db
			.insert(challenges)
			.values({
				lessonId,
				type,
				order: challengeOrder,
				question,
				audio: audio ?? null,
				image: image ?? null,
			})
			.returning()

		const challengeId = challenge[0].id

		const correctOption = {
			challengeId,
			correct: true,
			...getOptionValue(word),
		}

		const distractors = lessonWords
			.filter((w) => w.id !== word.id)
			.sort(() => 0.5 - Math.random())
			.slice(0, 5)
			.map((d) => ({
				challengeId,
				correct: false,
				...getOptionValue(d),
			}))

		// ✅ Shuffle all options (correct + distractors)
		const options = [correctOption, ...distractors].sort(
			() => 0.5 - Math.random()
		)

		await Promise.all(
			options.map((opt) => db.insert(challengeOptions).values(opt))
		)
	}

	return NextResponse.json({ message: 'Challenges created successfully!' })
}
