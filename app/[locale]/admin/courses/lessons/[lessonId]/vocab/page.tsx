import { and, asc, eq } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { supabaseDb as db } from '@/db'
import { lessons } from '@/db/schema/tables/lessons'
import {
	lessonNewVocab,
	lessonScriptVocab,
	lessonVocabTerms,
} from '@/db/schema/tables/lesson_vocab'
import { hebrewLexemes } from '@/db/schema/tables/hebrew_lexemes'
import { customHebrewLexemes } from '@/db/schema/tables/custom_hebrew_lexemes'
import { LessonVocabSelector } from '@/components/admin/lessons/LessonVocabSelector'

interface PageProps {
	params: Promise<{ locale: string; lessonId: string }>
}

export default async function LessonVocabPage({ params }: PageProps) {
	const { locale, lessonId } = await params
	const session = await getServerSession(authOptions)
	const role = session?.user?.role ?? 'guest'

	if (!session || !['admin', 'teacher'].includes(role)) {
		redirect(`/${locale}/login`)
	}

	const lesson = await db.query.lessons.findFirst({
		where: eq(lessons.id, lessonId),
	})
	if (!lesson) notFound()

	const rows = await db
		.select({
			vocabTermId: lessonScriptVocab.vocabTermId,
			surfaceInScript: lessonScriptVocab.surfaceInScript,
			frequency: lessonScriptVocab.frequency,
			consonants: lessonVocabTerms.consonants,
			biblicalLemma: hebrewLexemes.lemma,
			customLemma: customHebrewLexemes.lemma,
			selectedId: lessonNewVocab.vocabTermId,
		})
		.from(lessonScriptVocab)
		.innerJoin(
			lessonVocabTerms,
			eq(lessonScriptVocab.vocabTermId, lessonVocabTerms.id),
		)
		.leftJoin(
			hebrewLexemes,
			eq(lessonVocabTerms.biblicalLexemeId, hebrewLexemes.id),
		)
		.leftJoin(
			customHebrewLexemes,
			eq(lessonVocabTerms.customLexemeId, customHebrewLexemes.id),
		)
		.leftJoin(
			lessonNewVocab,
			and(
				eq(lessonNewVocab.lessonId, lessonId),
				eq(lessonNewVocab.vocabTermId, lessonScriptVocab.vocabTermId),
			),
		)
		.where(eq(lessonScriptVocab.lessonId, lessonId))
		.orderBy(asc(lessonVocabTerms.consonants))

	const items = rows.map((row) => ({
		vocabTermId: row.vocabTermId,
		surfaceInScript: row.surfaceInScript,
		consonants: row.consonants,
		frequency: row.frequency,
		biblicalLemma: row.biblicalLemma,
		customLemma: row.customLemma,
		selected: Boolean(row.selectedId),
	}))

	return (
		<LessonVocabSelector lessonId={lessonId} lessonSlug={lesson.slug} items={items} />
	)
}
