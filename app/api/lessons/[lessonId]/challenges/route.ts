// app/api/lessons/[lessonId]/challenges/route.ts
import db from '@/db/drizzle'
import { challenges, challengeOptions } from '@/db/schema'
import { eq, and, ne, inArray } from 'drizzle-orm'

export async function GET(
	req: Request,
	{ params }: { params: Record<string, string> }
) {
	const lessonId = Number(params.lessonId)

	// 1️⃣ Get all non-WATCH challenges for the lesson
	const rows = await db
		.select({
			id: challenges.id,
			question: challenges.question,
			type: challenges.type,
			order: challenges.order,
			image: challenges.image,
			audio: challenges.audio,
			video: challenges.video,
		})
		.from(challenges)
		.where(and(eq(challenges.lessonId, lessonId), ne(challenges.type, 'WATCH')))
		.orderBy(challenges.order)

	// 2️⃣ Gather all challenge IDs
	const challengeIds = rows.map((r) => r.id)
	if (challengeIds.length === 0) {
		return Response.json([])
	}

	// 3️⃣ Fetch all options for those challenges
	const options = await db
		.select()
		.from(challengeOptions)
		.where(inArray(challengeOptions.challengeId, challengeIds))

	// 4️⃣ Merge options into each challenge
	const result = rows.map((challenge) => ({
		...challenge,
		options: options.filter((opt) => opt.challengeId === challenge.id),
	}))

	return Response.json(result)
}
