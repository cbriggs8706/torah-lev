import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { supabaseDb as db } from '@/db'
import {
	quizQuestionAnswers,
	quizQuestions,
} from '@/db/schema/tables/modules'
import { quizQuestionSchema } from '@/forms/learningSchemas'
import { requireAdminAccess } from '@/lib/admin/requireAdmin'

export async function PATCH(
	req: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const unauthorized = await requireAdminAccess()
	if (unauthorized) return unauthorized

	try {
		const { id } = await params
		const parsed = quizQuestionSchema.parse(await req.json())

		const updated = await db.transaction(async (tx) => {
			const [question] = await tx
				.update(quizQuestions)
				.set({
					title: parsed.title,
					type: parsed.type,
					promptText: parsed.promptText ?? null,
					promptAssetId: parsed.promptAssetId ?? null,
					updatedAt: new Date(),
				})
				.where(eq(quizQuestions.id, id))
				.returning()

			if (!question) return null

			await tx
				.delete(quizQuestionAnswers)
				.where(eq(quizQuestionAnswers.questionId, id))

			await tx.insert(quizQuestionAnswers).values(
				parsed.answers.map((answer, index) => ({
					questionId: id,
					answerText: answer.answerText ?? null,
					answerAssetId: answer.answerAssetId ?? null,
					isCorrect: answer.isCorrect,
					sortOrder: answer.sortOrder ?? index,
				}))
			)

			return question
		})

		if (!updated) {
			return NextResponse.json(
				{ error: 'Quiz question not found' },
				{ status: 404 }
			)
		}

		return NextResponse.json(updated)
	} catch (error) {
		console.error('Failed to update quiz question', error)
		return NextResponse.json(
			{ error: 'Failed to update quiz question' },
			{ status: 400 }
		)
	}
}

export async function DELETE(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const unauthorized = await requireAdminAccess()
	if (unauthorized) return unauthorized

	const { id } = await params
	const [deleted] = await db
		.delete(quizQuestions)
		.where(eq(quizQuestions.id, id))
		.returning({ id: quizQuestions.id })

	if (!deleted) {
		return NextResponse.json(
			{ error: 'Quiz question not found' },
			{ status: 404 }
		)
	}

	return NextResponse.json({ success: true })
}
