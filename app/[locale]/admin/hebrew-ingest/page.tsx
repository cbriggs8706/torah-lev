// app/[locale]/admin/hebrew-ingest/page.tsx
import { CustomHebrewIngestForm } from '@/components/custom/CustomHebrewIngestForm'
import { LessonScriptIngestForm } from '@/components/admin/lessons/LessonScriptIngestForm'
import { supabaseDb as db } from '@/db'
import { customHebrewBooks } from '@/db/schema/tables/custom_hebrew_books'
import { lessons } from '@/db/schema/tables/lessons'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'

interface PageProps {
	params: Promise<{ locale: string }>
	searchParams: Promise<{ mode?: string; lessonId?: string }>
}

export default async function CustomIngestPage({ params, searchParams }: PageProps) {
	const { locale } = await params
	const { mode, lessonId } = await searchParams

	if (mode === 'lesson-script' && lessonId) {
		const lesson = await db.query.lessons.findFirst({
			where: eq(lessons.id, lessonId),
		})
		if (!lesson) notFound()

		return (
			<div className="px-4 py-6">
				<LessonScriptIngestForm
					locale={locale}
					lessonId={lesson.id}
					lessonSlug={lesson.slug}
					initialScript={lesson.lessonScript ?? ''}
				/>
			</div>
		)
	}

	const books = await db
		.select({
			id: customHebrewBooks.id,
			title: customHebrewBooks.title,
		})
		.from(customHebrewBooks)

	return (
		<div className="px-4 py-6">
			<CustomHebrewIngestForm customHebrewBooks={books} />
		</div>
	)
}
