import { and, eq } from 'drizzle-orm'
import db from '@/db/drizzle'
import { flashcardUserState } from '@/db/schema'
import { getUserId } from '@/lib/auth'

type StatusPayload = {
	cardId?: number
	courseId?: number
	language?: string
	action?: 'master' | 'unmaster' | 'addToStack' | 'removeFromStack' | 'set'
	isMastered?: boolean
	inMyStack?: boolean
}

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
			return new Response(JSON.stringify({ guest: true, statuses: [] }), {
				status: 200,
			})
		}

		const { searchParams } = new URL(req.url)
		const courseId = toNumber(searchParams.get('courseId'), 0)
		const language = searchParams.get('language') ?? 'he'

		if (!courseId) {
			return new Response(JSON.stringify({ error: 'Missing courseId' }), {
				status: 400,
			})
		}

		const statuses = await db
			.select({
				cardId: flashcardUserState.cardId,
				isMastered: flashcardUserState.isMastered,
				inMyStack: flashcardUserState.inMyStack,
			})
			.from(flashcardUserState)
			.where(
				and(
					eq(flashcardUserState.userId, userId!),
					eq(flashcardUserState.courseId, courseId),
					eq(flashcardUserState.language, language)
				)
			)

		return new Response(JSON.stringify({ statuses }), { status: 200 })
	} catch (error) {
		console.error('Error fetching flashcard statuses:', error)
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

		const payload = (await req.json()) as StatusPayload
		const cardId = payload.cardId
		const courseId = payload.courseId
		const language = payload.language ?? 'he'
		const action = payload.action ?? 'set'

		if (!cardId || !courseId) {
			return new Response(JSON.stringify({ error: 'Invalid payload' }), {
				status: 400,
			})
		}

		const existing = await db.query.flashcardUserState.findFirst({
			where: and(
				eq(flashcardUserState.userId, userId!),
				eq(flashcardUserState.courseId, courseId),
				eq(flashcardUserState.cardId, cardId),
				eq(flashcardUserState.language, language)
			),
		})

		const now = new Date()
		const nextStatus = {
			isMastered:
				action === 'master'
					? true
					: action === 'unmaster'
						? false
						: payload.isMastered ?? existing?.isMastered ?? false,
			inMyStack:
				action === 'addToStack'
					? true
					: action === 'removeFromStack' || action === 'master'
						? false
						: payload.inMyStack ?? existing?.inMyStack ?? false,
		}

		if (existing) {
			await db
				.update(flashcardUserState)
				.set({
					...nextStatus,
					updatedAt: now,
				})
				.where(eq(flashcardUserState.id, existing.id))
		} else {
			await db.insert(flashcardUserState).values({
				userId: userId!,
				cardId,
				courseId,
				language,
				dueAt: now,
				...nextStatus,
				updatedAt: now,
			})
		}

		return new Response(
			JSON.stringify({
				success: true,
				status: { cardId, ...nextStatus },
			}),
			{ status: 200 }
		)
	} catch (error) {
		console.error('Error updating flashcard status:', error)
		return new Response(JSON.stringify({ error: 'Server error' }), {
			status: 500,
		})
	}
}
