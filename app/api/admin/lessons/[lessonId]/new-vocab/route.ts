import { NextRequest, NextResponse } from 'next/server'
import { and, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseDb as db } from '@/db'
import { lessonScriptVocab, lessonNewVocab } from '@/db/schema/tables/lesson_vocab'
import { lessons } from '@/db/schema/tables/lessons'

const UpdateNewVocabSchema = z.object({
	vocabTermIds: z.array(z.string().uuid()).default([]),
})

export async function PUT(
	req: NextRequest,
	context: { params: Promise<{ lessonId: string }> },
) {
	try {
		const session = await getServerSession(authOptions)
		const role = session?.user?.role ?? 'guest'
		if (!session || !['admin', 'teacher'].includes(role)) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const { lessonId } = await context.params
		const parsed = UpdateNewVocabSchema.safeParse(await req.json())
		if (!parsed.success) {
			return NextResponse.json(
				{ error: 'Invalid payload', details: parsed.error.flatten() },
				{ status: 400 },
			)
		}

		const lesson = await db.query.lessons.findFirst({
			where: eq(lessons.id, lessonId),
		})
		if (!lesson) {
			return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
		}

		const validRows =
			parsed.data.vocabTermIds.length > 0
				? await db
						.select({ vocabTermId: lessonScriptVocab.vocabTermId })
						.from(lessonScriptVocab)
						.where(
							and(
								eq(lessonScriptVocab.lessonId, lessonId),
								inArray(lessonScriptVocab.vocabTermId, parsed.data.vocabTermIds),
							),
						)
				: []

		const validTermIds = validRows.map((row) => row.vocabTermId)

		await db.transaction(async (tx) => {
			await tx.delete(lessonNewVocab).where(eq(lessonNewVocab.lessonId, lessonId))
			if (validTermIds.length > 0) {
				await tx.insert(lessonNewVocab).values(
					validTermIds.map((vocabTermId) => ({
						lessonId,
						vocabTermId,
					})),
				)
			}
		})

		return NextResponse.json({
			ok: true,
			lessonId,
			selectedCount: validTermIds.length,
		})
	} catch (err) {
		console.error('Failed to update lesson new vocab', err)
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : 'Unknown error' },
			{ status: 500 },
		)
	}
}
