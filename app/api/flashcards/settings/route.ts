import { and, eq } from 'drizzle-orm'
import db from '@/db/drizzle'
import { flashcardUserSettings } from '@/db/schema'
import { getUserId } from '@/lib/auth'

const isGuestId = (id?: string | null) =>
	!id || id.startsWith('guest-') || id.startsWith('guest')

function toNumber(value: string | null, fallback: number) {
	if (!value) return fallback
	const parsed = Number(value)
	return Number.isFinite(parsed) ? parsed : fallback
}

export async function GET(req: Request) {
	try {
		const userId = await getUserId()
		if (isGuestId(userId)) {
			return new Response(JSON.stringify({ guest: true }), { status: 200 })
		}

		const { searchParams } = new URL(req.url)
		const courseId = toNumber(searchParams.get('courseId'), 0)
		const language = searchParams.get('language') ?? 'he'

		if (!courseId) {
			return new Response(JSON.stringify({ error: 'Missing courseId' }), {
				status: 400,
			})
		}

		const settings = await db.query.flashcardUserSettings.findFirst({
			where: and(
				eq(flashcardUserSettings.userId, userId!),
				eq(flashcardUserSettings.courseId, courseId),
				eq(flashcardUserSettings.language, language)
			),
		})

		return new Response(JSON.stringify({ settings }), { status: 200 })
	} catch (error) {
		console.error('❌ Error fetching flashcard settings:', error)
		return new Response(JSON.stringify({ error: 'Server error' }), {
			status: 500,
		})
	}
}

export async function POST(req: Request) {
	try {
		const userId = await getUserId()
		if (isGuestId(userId)) {
			return new Response(JSON.stringify({ guest: true, success: false }), {
				status: 200,
			})
		}

		const payload = (await req.json()) as {
			courseId?: number
			language?: string
			sessionSize?: number
			newRatio?: number
		}

		const courseId = payload.courseId
		const language = payload.language ?? 'he'
		const sessionSize = Math.max(5, Math.min(100, payload.sessionSize ?? 20))
		const newRatio = Math.min(Math.max(payload.newRatio ?? 0.2, 0), 0.5)

		if (!courseId) {
			return new Response(JSON.stringify({ error: 'Missing courseId' }), {
				status: 400,
			})
		}

		await db
			.insert(flashcardUserSettings)
			.values({
				userId: userId!,
				courseId,
				language,
				sessionSize,
				newRatio,
			})
			.onConflictDoUpdate({
				target: [
					flashcardUserSettings.userId,
					flashcardUserSettings.courseId,
					flashcardUserSettings.language,
				],
				set: {
					sessionSize,
					newRatio,
					updatedAt: new Date(),
				},
			})

		return new Response(JSON.stringify({ success: true }), { status: 200 })
	} catch (error) {
		console.error('❌ Error saving flashcard settings:', error)
		return new Response(JSON.stringify({ error: 'Server error' }), {
			status: 500,
		})
	}
}
