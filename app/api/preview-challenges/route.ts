import { NextResponse } from 'next/server'
import db from '@/db/drizzle'
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
	type: string
}

export const POST = async (req: Request) => {
	const { lessonId, type } = (await req.json()) as {
		lessonId: number
		type: ChallengeType
	}

	const lesson = await db.query.lessons.findFirst({
		where: (l, { eq }) => eq(l.id, lessonId),
	})

	if (!lesson) {
		return new NextResponse('Lesson not found', { status: 404 })
	}

	const awbMatch = lesson.title.match(/AwB\s*(\d+)/i)
	const awbNumber = awbMatch ? awbMatch[1] : '???'
	const lessonKey = `awb${awbNumber}`

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

	const getPrompt = (
		word: Word
	): { audio?: string; image?: string; hebNiqqud?: string } => {
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
					// hebNiqqud: word.hebNiqqud,
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
		type: string
		imageSrc?: string
		audioSrc?: string
		hebNiqqud?: string
	} => {
		const fallbackText = word.engTransliteration ?? '[missing]'

		switch (type) {
			case 'AUDIO-VISUAL':
				return {
					text: fallbackText,
					type: word.type,
					// audioSrc: normalizeAudio(word.hebAudio),
					imageSrc: word.images?.[0],
				}
			case 'TEXT-VISUAL':
				return {
					text: fallbackText,
					type: word.type,
					// hebNiqqud: word.hebNiqqud,
					imageSrc: word.images?.[0],
				}
			case 'VISUAL-AUDIO':
				return {
					text: fallbackText,
					type: word.type,
					// imageSrc: word.images?.[0],
					audioSrc: normalizeAudio(word.hebAudio),
				}
			case 'TEXT-AUDIO':
				return {
					text: fallbackText,
					type: word.type,
					// hebNiqqud: word.hebNiqqud,
					audioSrc: normalizeAudio(word.hebAudio),
				}
			case 'AUDIO-TEXT':
				return {
					text: fallbackText,
					type: word.type,
					// audioSrc: normalizeAudio(word.hebAudio),
					hebNiqqud: word.hebNiqqud,
				}
			case 'VISUAL-TEXT':
				return {
					text: fallbackText,
					type: word.type,
					// imageSrc: word.images?.[0],
					hebNiqqud: word.hebNiqqud,
				}
			default:
				return {
					text: fallbackText,
					type: word.type,
				}
		}
	}

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

	const challenges = lessonWords.map((word, i) => {
		const order = i + 3
		const translit = word.engTransliteration ?? 'unknown'
		const question = `AwB${awbNumber}.${order} ${translit}`
		const { audio, image, hebNiqqud } = getPrompt(word)

		const correct = { ...getOptionValue(word), correct: true }

		let possibleDistractors = lessonWords.filter((w) => w.id !== word.id)

		// ✅ If the correct answer is a word, only allow word distractors
		if (word.type === 'word') {
			possibleDistractors = possibleDistractors.filter((w) => w.type === 'word')
		}

		const distractors = possibleDistractors
			.sort(() => 0.5 - Math.random())
			.slice(0, 5)
			.map((d) => ({ ...getOptionValue(d), correct: false }))

		return {
			order,
			question,
			type: word.type,
			audio: audio ?? null,
			image: image ?? null,
			hebNiqqud: hebNiqqud ?? null,
			options: [correct, ...distractors].sort(() => 0.5 - Math.random()),
		}
	})

	return NextResponse.json(challenges)
}
