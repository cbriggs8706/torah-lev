import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseDb as db } from '@/db'
import { lessons } from '@/db/schema/tables/lessons'
import {
	buildLessonScriptAnalysis,
	type LessonScriptOverrideMap,
	type LessonScriptSegmentationOverrides,
	syncLessonScriptVocabulary,
} from '@/lib/hebrew/lessonScriptVocabulary'

const AnalyzeLessonScriptSchema = z.object({
	lessonScript: z.string().min(1),
	segmentationOverrides: z.record(z.string(), z.array(z.string())).optional(),
})

const SaveLessonScriptSchema = AnalyzeLessonScriptSchema.extend({
	analysisDigest: z.string().min(1),
	overrides: z
		.record(
			z.string(),
			z.object({
				source: z.enum(['BIBLICAL', 'CUSTOM']),
				id: z.string().uuid(),
			}),
		)
		.optional(),
	segmentationOverrides: z.record(z.string(), z.array(z.string())).optional(),
})

export async function POST(
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
		const parsed = AnalyzeLessonScriptSchema.safeParse(await req.json())
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

		const analysis = await buildLessonScriptAnalysis(
			parsed.data.lessonScript,
			(parsed.data.segmentationOverrides ?? {}) as LessonScriptSegmentationOverrides,
		)
		return NextResponse.json({ ok: true, analysis })
	} catch (err) {
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : 'Unknown error' },
			{ status: 500 },
		)
	}
}

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
		const parsed = SaveLessonScriptSchema.safeParse(await req.json())
		if (!parsed.success) {
			return NextResponse.json(
				{ error: 'Invalid payload', details: parsed.error.flatten() },
				{ status: 400 },
			)
		}

		const lesson = await db.query.lessons.findFirst({
			where: eq(lessons.id, lessonId),
			with: { unit: true },
		})

		if (!lesson) {
			return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
		}

		const analysis = await buildLessonScriptAnalysis(
			parsed.data.lessonScript,
			(parsed.data.segmentationOverrides ?? {}) as LessonScriptSegmentationOverrides,
		)
		if (analysis.digest !== parsed.data.analysisDigest) {
			return NextResponse.json(
				{ error: 'Analysis digest mismatch. Re-analyze before saving.' },
				{ status: 409 },
			)
		}

		const result = await db.transaction(async (tx) => {
			await tx
				.update(lessons)
				.set({ lessonScript: parsed.data.lessonScript })
				.where(eq(lessons.id, lessonId))

			return syncLessonScriptVocabulary(
				tx,
				lessonId,
				analysis,
				(parsed.data.overrides ?? {}) as LessonScriptOverrideMap,
			)
		})

		return NextResponse.json({
			ok: true,
			lessonId,
			vocabCount: result.vocabCount,
			tokenCount: analysis.tokenCount,
			customLexemesAdded: result.customLexemesAdded,
			courseId: lesson.unit.courseId,
		})
	} catch (err) {
		console.error('Failed to save lesson script', err)
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : 'Unknown error' },
			{ status: 500 },
		)
	}
}

export async function GET(
	_req: NextRequest,
	context: { params: Promise<{ lessonId: string }> },
) {
	try {
		const session = await getServerSession(authOptions)
		const role = session?.user?.role ?? 'guest'
		if (!session || !['admin', 'teacher'].includes(role)) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const { lessonId } = await context.params

		const lesson = await db.query.lessons.findFirst({
			where: eq(lessons.id, lessonId),
			with: { unit: true },
		})
		if (!lesson) {
			return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
		}

		return NextResponse.json({
			lessonId: lesson.id,
			lessonScript: lesson.lessonScript ?? '',
			courseId: lesson.unit.courseId,
		})
	} catch (err) {
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : 'Unknown error' },
			{ status: 500 },
		)
	}
}
