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

interface Word {
	id: number
	engTransliteration: string
	hebNiqqud?: string
	hebAudio?: string
	images?: string[]
	lessons: string[]
}

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

	const normalizeAudio = (audio?: string) =>
		audio ? (audio.startsWith('/') ? audio : `/${audio}`) : undefined

	const hasRequiredFields = (word: Word): boolean => {
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

	const getPrompt = (
		word: Word
	): { image?: string; audio?: string; hebNiqqud?: string } => {
		switch (type) {
			case 'AUDIO-VISUAL':
				return {
					audio: normalizeAudio(word.hebAudio),
					// image: word.images?.[0],
				}
			case 'AUDIO-TEXT':
				return {
					audio: normalizeAudio(word.hebAudio),
					// hebNiqqud: word.hebNiqqud,
				}
			case 'VISUAL-AUDIO':
				return {
					image: word.images?.[0],
					// audio: normalizeAudio(word.hebAudio),
				}
			case 'VISUAL-TEXT':
				return {
					image: word.images?.[0],
					// hebNiqqud: word.hebNiqqud
				}
			case 'TEXT-AUDIO':
				return {
					hebNiqqud: word.hebNiqqud,
					// audio: normalizeAudio(word.hebAudio),
				}
			case 'TEXT-VISUAL':
				return {
					hebNiqqud: word.hebNiqqud,
					// image: word.images?.[0],
				}
			default:
				return {}
		}
	}

	const getOptionValue = (
		word: Word
	): {
		text: string // always required
		imageSrc?: string
		audioSrc?: string
		hebNiqqud?: string
	} => {
		const fallbackText = word.engTransliteration ?? '[missing]'

		switch (type) {
			case 'AUDIO-VISUAL':
				return {
					text: fallbackText,
					// audioSrc: normalizeAudio(word.hebAudio),
					imageSrc: word.images?.[0],
				}
			case 'TEXT-VISUAL':
				return {
					text: fallbackText,
					// hebNiqqud: word.hebNiqqud,
					imageSrc: word.images?.[0],
				}
			case 'VISUAL-AUDIO':
				return {
					text: fallbackText,
					// imageSrc: word.images?.[0],
					audioSrc: normalizeAudio(word.hebAudio),
				}
			case 'TEXT-AUDIO':
				return {
					text: fallbackText,
					// hebNiqqud: word.hebNiqqud,
					audioSrc: normalizeAudio(word.hebAudio),
				}
			case 'AUDIO-TEXT':
				return {
					text: fallbackText,
					// audioSrc: normalizeAudio(word.hebAudio),
					hebNiqqud: word.hebNiqqud,
				}
			case 'VISUAL-TEXT':
				return {
					text: fallbackText,
					// imageSrc: word.images?.[0],
					hebNiqqud: word.hebNiqqud,
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
		const { audio, image, hebNiqqud } = getPrompt(word)
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
				hebNiqqud: hebNiqqud ?? null,
			})
			.returning()

		const challengeId = challenge[0].id

		const baseOption = getOptionValue(word)
		const distractorsRaw = lessonWords.filter((w) => w.id !== word.id)

		const distractors = distractorsRaw
			.sort(() => 0.5 - Math.random())
			.slice(0, 5)
			.map(getOptionValue)
			.map((opt) => ({ ...opt, challengeId, correct: false }))

		const correctOption = { ...baseOption, challengeId, correct: true }

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
