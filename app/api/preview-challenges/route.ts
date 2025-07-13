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

	const getPrompt = (word: any): { audio?: string; image?: string } => {
		switch (type) {
			case 'AUDIO-VISUAL':
			case 'AUDIO-TEXT':
			case 'TEXT-AUDIO':
				return { audio: word.hebAudio ? `/${word.hebAudio}` : undefined }
			case 'VISUAL-AUDIO':
			case 'VISUAL-TEXT':
			case 'TEXT-VISUAL':
				return { image: word.images?.[0] }
			default:
				return {}
		}
	}

	const getOptionValue = (
		word: any
	): {
		text: string
		imageSrc?: string
		audioSrc?: string
	} => {
		// const fallbackText = word.engTransliteration ?? '[missing]'
		switch (type) {
			case 'AUDIO-VISUAL':
			case 'TEXT-VISUAL':
				return {
					text: word.hebNiqqud,
					imageSrc: word.images?.[0],
				}
			case 'VISUAL-AUDIO':
			case 'TEXT-AUDIO':
				return {
					text: word.hebNiqqud,
					audioSrc: word.hebAudio ? `/${word.hebAudio}` : undefined,
				}
			case 'AUDIO-TEXT':
			case 'VISUAL-TEXT':
			default:
				return {
					text: word.hebNiqqud,
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
		const { audio, image } = getPrompt(word)

		const correct = { ...getOptionValue(word), correct: true }

		const distractors = lessonWords
			.filter((w) => w.id !== word.id)
			.sort(() => 0.5 - Math.random())
			.slice(0, 5)
			.map((d) => ({ ...getOptionValue(d), correct: false }))

		return {
			order,
			question,
			type,
			audio: audio ?? null,
			image: image ?? null,
			options: [correct, ...distractors].sort(() => 0.5 - Math.random()),
		}
	})

	return NextResponse.json(challenges)
}
