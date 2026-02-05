import { and, eq } from 'drizzle-orm'
import db from '@/db/drizzle'
import { flashcardUserState } from '@/db/schema'
import { getUserId } from '@/lib/auth'

type UpdatePayload = {
	cardId?: number
	courseId?: number
	language?: string
	action?: 'reset' | 'suspend' | 'unsuspend' | 'update'
	updates?: {
		dueAt?: string
		intervalDays?: number
		ease?: number
		state?: 'new' | 'learning' | 'review' | 'relearning' | 'suspended'
		learningStep?: number
		lapses?: number
		reps?: number
		leech?: boolean
	}
}

const isGuestId = (id?: string | null) =>
	!id || id.startsWith('guest-') || id.startsWith('guest')

export async function POST(req: Request) {
	try {
		const userId = await getUserId()
		if (isGuestId(userId)) {
			return new Response(JSON.stringify({ guest: true, success: false }), {
				status: 200,
			})
		}

		const payload = (await req.json()) as UpdatePayload
		const cardId = payload.cardId
		const courseId = payload.courseId
		const language = payload.language ?? 'he'
		const action = payload.action ?? 'update'

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

		if (!existing) {
			return new Response(JSON.stringify({ error: 'Card not found' }), {
				status: 404,
			})
		}

		const now = new Date()
		let update: Partial<typeof flashcardUserState.$inferInsert> = {
			updatedAt: now,
		}

		if (action === 'reset') {
			update = {
				...update,
				state: 'new',
				dueAt: now,
				learningStep: 0,
				intervalDays: 0,
				ease: 2.5,
				reps: 0,
				lapses: 0,
				leech: false,
				leechSuspendedAt: null,
				lastReviewedAt: null,
			}
		} else if (action === 'suspend') {
			update = {
				...update,
				state: 'suspended',
				leech: true,
				leechSuspendedAt: now,
			}
		} else if (action === 'unsuspend') {
			update = {
				...update,
				state: existing.state === 'suspended' ? 'review' : existing.state,
				leech: false,
				leechSuspendedAt: null,
			}
		} else {
			const updates = payload.updates ?? {}
			update = {
				...update,
				state: updates.state ?? existing.state,
				dueAt: updates.dueAt ? new Date(updates.dueAt) : existing.dueAt,
				learningStep:
					updates.learningStep ?? existing.learningStep ?? 0,
				intervalDays: updates.intervalDays ?? existing.intervalDays ?? 0,
				ease: updates.ease ?? existing.ease ?? 2.5,
				reps: updates.reps ?? existing.reps ?? 0,
				lapses: updates.lapses ?? existing.lapses ?? 0,
				leech: updates.leech ?? existing.leech ?? false,
			}
		}

		await db
			.update(flashcardUserState)
			.set(update)
			.where(eq(flashcardUserState.id, existing.id))

		return new Response(JSON.stringify({ success: true, update }), {
			status: 200,
		})
	} catch (error) {
		console.error('❌ Error updating flashcard schedule:', error)
		return new Response(JSON.stringify({ error: 'Server error' }), {
			status: 500,
		})
	}
}
