import { and, asc, eq, lte, not } from 'drizzle-orm'
import db from '@/db/drizzle'
import { flashcardUserState } from '@/db/schema'
import { getUserId } from '@/lib/auth'

const DEFAULT_SESSION_SIZE = 20
const DEFAULT_NEW_RATIO = 0.2

function isGuestId(userId: string | null) {
	return !userId || userId.startsWith('guest')
}

function toNumber(value: string | null, fallback: number) {
	if (!value) return fallback
	const parsed = Number(value)
	return Number.isFinite(parsed) ? parsed : fallback
}

function interleave<T>(due: T[], fresh: T[], limit: number) {
	const result: T[] = []
	let d = 0
	let n = 0

	while (result.length < limit && (d < due.length || n < fresh.length)) {
		for (let i = 0; i < 4 && d < due.length && result.length < limit; i++) {
			result.push(due[d++])
		}
		if (n < fresh.length && result.length < limit) {
			result.push(fresh[n++])
		}
		if (d >= due.length && n < fresh.length) {
			while (n < fresh.length && result.length < limit) {
				result.push(fresh[n++])
			}
		}
		if (n >= fresh.length && d < due.length) {
			while (d < due.length && result.length < limit) {
				result.push(due[d++])
			}
		}
	}

	return result
}

export async function GET(req: Request) {
	try {
		const userId = await getUserId()
		if (isGuestId(userId)) {
			return new Response(JSON.stringify({ guest: true, cards: [] }), {
				status: 200,
			})
		}

		const { searchParams } = new URL(req.url)
		const courseId = toNumber(searchParams.get('courseId'), 0)
		const language = searchParams.get('language') ?? 'he'
		const limit = Math.max(1, toNumber(searchParams.get('limit'), DEFAULT_SESSION_SIZE))
		const ratio = Number(searchParams.get('newRatio') ?? DEFAULT_NEW_RATIO)
		const newRatio = Number.isFinite(ratio) ? Math.min(Math.max(ratio, 0), 1) : DEFAULT_NEW_RATIO

		if (!courseId) {
			return new Response(JSON.stringify({ error: 'Missing courseId' }), {
				status: 400,
			})
		}

		const now = new Date()
		const dueTarget = Math.max(0, Math.round(limit * (1 - newRatio)))
		const newTarget = Math.max(0, limit - dueTarget)

		const dueCards = await db
			.select()
			.from(flashcardUserState)
			.where(
				and(
					eq(flashcardUserState.userId, userId!),
					eq(flashcardUserState.courseId, courseId),
					eq(flashcardUserState.language, language),
					not(eq(flashcardUserState.state, 'suspended')),
					not(eq(flashcardUserState.state, 'new')),
					lte(flashcardUserState.dueAt, now)
				)
			)
			.orderBy(asc(flashcardUserState.dueAt))
			.limit(limit)

		const newCards = await db
			.select()
			.from(flashcardUserState)
			.where(
				and(
					eq(flashcardUserState.userId, userId!),
					eq(flashcardUserState.courseId, courseId),
					eq(flashcardUserState.language, language),
					eq(flashcardUserState.state, 'new')
				)
			)
			.orderBy(asc(flashcardUserState.cardId))
			.limit(limit)

		const dueSelected = dueCards.slice(0, dueTarget)
		const newSelected = newCards.slice(0, newTarget)

		if (dueSelected.length < dueTarget) {
			const deficit = dueTarget - dueSelected.length
			newSelected.push(...newCards.slice(newTarget, newTarget + deficit))
		}

		if (newSelected.length < newTarget) {
			const deficit = newTarget - newSelected.length
			dueSelected.push(...dueCards.slice(dueTarget, dueTarget + deficit))
		}

		const queue = interleave(dueSelected, newSelected, limit)

		return new Response(
			JSON.stringify({
				cards: queue,
				count: queue.length,
				target: { due: dueTarget, new: newTarget },
				available: { due: dueCards.length, new: newCards.length },
			}),
			{ status: 200 }
		)
	} catch (error) {
		console.error('❌ Error building flashcard session:', error)
		return new Response(JSON.stringify({ error: 'Server error' }), {
			status: 500,
		})
	}
}
