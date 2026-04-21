import { NextResponse } from 'next/server'
import { supabaseDb as db } from '@/db'
import {
	quizQuestionAnswers,
	quizQuestions,
} from '@/db/schema/tables/modules'
import { quizQuestionSchema } from '@/forms/learningSchemas'
import { requireAdminAccess } from '@/lib/admin/requireAdmin'

export async function GET() {
	const unauthorized = await requireAdminAccess()
	if (unauthorized) return unauthorized

	const rows = await db.query.quizQuestions.findMany({
		with: {
			answers: {
				orderBy: (quizQuestionAnswers, { asc }) => [
					asc(quizQuestionAnswers.sortOrder),
				],
			},
		},
		orderBy: (quizQuestions, { asc }) => [asc(quizQuestions.title)],
	})

	return NextResponse.json(rows)
}

export async function POST(req: Request) {
	const unauthorized = await requireAdminAccess()
	if (unauthorized) return unauthorized

	try {
		const parsed = quizQuestionSchema.parse(await req.json())

		const created = await db.transaction(async (tx) => {
			const [question] = await tx
				.insert(quizQuestions)
				.values({
					title: parsed.title,
					type: parsed.type,
					promptText: parsed.promptText ?? null,
					promptAssetId: parsed.promptAssetId ?? null,
				})
				.returning()

			await tx.insert(quizQuestionAnswers).values(
				parsed.answers.map((answer, index) => ({
					questionId: question.id,
					answerText: answer.answerText ?? null,
					answerAssetId: answer.answerAssetId ?? null,
					isCorrect: answer.isCorrect,
					sortOrder: answer.sortOrder ?? index,
				}))
			)

			return question
		})

		return NextResponse.json(created, { status: 201 })
	} catch (error) {
		console.error('Failed to create quiz question', error)
		return NextResponse.json(
			{ error: 'Failed to create quiz question' },
			{ status: 400 }
		)
	}
}
