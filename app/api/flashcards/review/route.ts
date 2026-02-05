import { and, eq } from 'drizzle-orm'
import db from '@/db/drizzle'
import { flashcardReviewLog, flashcardUserState } from '@/db/schema'
import { getUserId } from '@/lib/auth'
import {
	applyReview,
	type FlashcardScheduling,
	type ReviewRating,
} from '@/lib/flashcards/scheduler'

type ReviewPayload = {
	cardId?: number
	courseId?: number
	language?: string
	rating?: ReviewRating
}

const isGuestId = (id?: string | null) =>
	!id || id.startsWith('guest-') || id.startsWith('guest')

function toScheduling(row: typeof flashcardUserState.$inferSelect): FlashcardScheduling {
	return {
		state: row.state,
		dueAt: row.dueAt,
		learningStep: row.learningStep ?? 0,
		intervalDays: row.intervalDays ?? 0,
		ease: row.ease ?? 2.5,
		reps: row.reps ?? 0,
		lapses: row.lapses ?? 0,
		leech: row.leech ?? false,
		lastReviewedAt: row.lastReviewedAt ?? null,
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

		const payload = (await req.json()) as ReviewPayload
		const cardId = payload.cardId
		const courseId = payload.courseId
		const language = payload.language ?? 'he'
		const rating = payload.rating

		if (!cardId || !courseId || !rating) {
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
		const baseState: FlashcardScheduling = existing
			? toScheduling(existing)
			: {
					state: 'new',
					dueAt: now,
					learningStep: 0,
					intervalDays: 0,
					ease: 2.5,
					reps: 0,
					lapses: 0,
					leech: false,
					lastReviewedAt: null,
			  }

		const { prev, next } = applyReview(baseState, rating, now)

		const leechSuspendedAt =
			next.leech && !baseState.leech ? now : existing?.leechSuspendedAt ?? null

		if (existing) {
			await db
				.update(flashcardUserState)
				.set({
					state: next.state,
					dueAt: next.dueAt,
					learningStep: next.learningStep,
					intervalDays: next.intervalDays,
					ease: next.ease,
					reps: next.reps,
					lapses: next.lapses,
					leech: next.leech,
					leechSuspendedAt,
					lastReviewedAt: next.lastReviewedAt ?? now,
					updatedAt: now,
				})
				.where(eq(flashcardUserState.id, existing.id))
		} else {
			await db.insert(flashcardUserState).values({
				userId: userId!,
				cardId,
				courseId,
				language,
				state: next.state,
				dueAt: next.dueAt,
				learningStep: next.learningStep,
				intervalDays: next.intervalDays,
				ease: next.ease,
				reps: next.reps,
				lapses: next.lapses,
				leech: next.leech,
				leechSuspendedAt,
				lastReviewedAt: next.lastReviewedAt ?? now,
			})
		}

		await db.insert(flashcardReviewLog).values({
			userId: userId!,
			cardId,
			courseId,
			language,
			rating,
			reviewedAt: now,
			prevIntervalDays: prev.intervalDays,
			nextIntervalDays: next.intervalDays,
			prevEase: prev.ease,
			nextEase: next.ease,
			prevState: prev.state,
			nextState: next.state,
		})

		return new Response(
			JSON.stringify({
				success: true,
				next,
				prev,
			}),
			{ status: 200 }
		)
	} catch (error) {
		console.error('❌ Error reviewing flashcard:', error)
		return new Response(JSON.stringify({ error: 'Server error' }), {
			status: 500,
		})
	}
}
