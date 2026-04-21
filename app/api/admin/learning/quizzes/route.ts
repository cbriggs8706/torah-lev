import { NextResponse } from 'next/server'
import { supabaseDb as db } from '@/db'
import {
	quizQuestionAssignments,
	quizzes,
} from '@/db/schema/tables/modules'
import { quizSchema } from '@/forms/learningSchemas'
import { requireAdminAccess } from '@/lib/admin/requireAdmin'

export async function GET() {
	const unauthorized = await requireAdminAccess()
	if (unauthorized) return unauthorized

	const rows = await db.query.quizzes.findMany({
		with: {
			questionAssignments: {
				with: {
					question: true,
				},
				orderBy: (quizQuestionAssignments, { asc }) => [
					asc(quizQuestionAssignments.sortOrder),
				],
			},
		},
		orderBy: (quizzes, { asc }) => [asc(quizzes.title)],
	})

	return NextResponse.json(rows)
}

export async function POST(req: Request) {
	const unauthorized = await requireAdminAccess()
	if (unauthorized) return unauthorized

	try {
		const parsed = quizSchema.parse(await req.json())

		const created = await db.transaction(async (tx) => {
			const [quiz] = await tx
				.insert(quizzes)
				.values({ title: parsed.title })
				.returning()

			if (parsed.questionIds.length) {
				await tx.insert(quizQuestionAssignments).values(
					parsed.questionIds.map((questionId, index) => ({
						quizId: quiz.id,
						questionId,
						sortOrder: index,
					}))
				)
			}

			return quiz
		})

		return NextResponse.json(created, { status: 201 })
	} catch (error) {
		console.error('Failed to create quiz', error)
		return NextResponse.json({ error: 'Failed to create quiz' }, { status: 400 })
	}
}
