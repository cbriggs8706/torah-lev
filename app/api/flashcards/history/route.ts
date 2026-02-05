import { and, desc, eq, sql } from 'drizzle-orm'
import db from '@/db/drizzle'
import { flashcardReviewLog } from '@/db/schema'
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
			return new Response(JSON.stringify({ guest: true, history: [] }), {
				status: 200,
			})
		}

		const { searchParams } = new URL(req.url)
		const courseId = toNumber(searchParams.get('courseId'), 0)
		const language = searchParams.get('language') ?? 'he'
		const cardId = toNumber(searchParams.get('cardId'), 0)
		const limit = Math.max(1, toNumber(searchParams.get('limit'), 10))

		if (!courseId) {
			return new Response(JSON.stringify({ error: 'Missing courseId' }), {
				status: 400,
			})
		}

		const where = and(
			eq(flashcardReviewLog.userId, userId!),
			eq(flashcardReviewLog.courseId, courseId),
			eq(flashcardReviewLog.language, language),
			cardId ? eq(flashcardReviewLog.cardId, cardId) : undefined
		)

		const history = await db
			.select()
			.from(flashcardReviewLog)
			.where(where)
			.orderBy(desc(flashcardReviewLog.reviewedAt))
			.limit(limit)

		const statsRow = await db
			.select({
				total: sql<number>`coalesce(count(*)::int, 0)`,
				again: sql<number>`coalesce(sum(case when rating = 'again' then 1 else 0 end)::int, 0)`,
				hard: sql<number>`coalesce(sum(case when rating = 'hard' then 1 else 0 end)::int, 0)`,
				good: sql<number>`coalesce(sum(case when rating = 'good' then 1 else 0 end)::int, 0)`,
				easy: sql<number>`coalesce(sum(case when rating = 'easy' then 1 else 0 end)::int, 0)`,
				avgNextInterval: sql<number>`coalesce(avg(next_interval_days)::float, 0)`,
				lastReviewedAt: sql<Date>`max(reviewed_at)`,
			})
			.from(flashcardReviewLog)
			.where(where)
			.then((rows) => rows[0])

		const ratingRows = await db
			.select({ rating: flashcardReviewLog.rating })
			.from(flashcardReviewLog)
			.where(where)
			.orderBy(desc(flashcardReviewLog.reviewedAt))
			.limit(200)

		let currentStreak = 0
		let bestStreak = 0
		let running = 0
		for (const row of ratingRows) {
			if (row.rating === 'again') {
				if (currentStreak === 0) {
					currentStreak = running
				}
				bestStreak = Math.max(bestStreak, running)
				running = 0
				continue
			}
			running += 1
		}
		if (currentStreak === 0) currentStreak = running
		bestStreak = Math.max(bestStreak, running)

		const stats = {
			...statsRow,
			currentStreak,
			bestStreak,
		}

		return new Response(JSON.stringify({ history, stats }), { status: 200 })
	} catch (error) {
		console.error('❌ Error fetching flashcard history:', error)
		return new Response(JSON.stringify({ error: 'Server error' }), {
			status: 500,
		})
	}
}
