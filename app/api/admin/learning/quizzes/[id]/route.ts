import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { supabaseDb as db } from '@/db'
import {
	quizQuestionAssignments,
	quizzes,
} from '@/db/schema/tables/modules'
import { quizSchema } from '@/forms/learningSchemas'
import { requireAdminAccess } from '@/lib/admin/requireAdmin'

export async function PATCH(
	req: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const unauthorized = await requireAdminAccess()
	if (unauthorized) return unauthorized

	try {
		const { id } = await params
		const parsed = quizSchema.parse(await req.json())

		const updated = await db.transaction(async (tx) => {
			const [quiz] = await tx
				.update(quizzes)
				.set({
					title: parsed.title,
					updatedAt: new Date(),
				})
				.where(eq(quizzes.id, id))
				.returning()

			if (!quiz) return null

			await tx
				.delete(quizQuestionAssignments)
				.where(eq(quizQuestionAssignments.quizId, id))

			if (parsed.questionIds.length) {
				await tx.insert(quizQuestionAssignments).values(
					parsed.questionIds.map((questionId, index) => ({
						quizId: id,
						questionId,
						sortOrder: index,
					}))
				)
			}

			return quiz
		})

		if (!updated) {
			return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
		}

		return NextResponse.json(updated)
	} catch (error) {
		console.error('Failed to update quiz', error)
		return NextResponse.json({ error: 'Failed to update quiz' }, { status: 400 })
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
		.delete(quizzes)
		.where(eq(quizzes.id, id))
		.returning({ id: quizzes.id })

	if (!deleted) {
		return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
	}

	return NextResponse.json({ success: true })
}
