import { notFound } from 'next/navigation'
import { DeleteResourcePanel } from '@/components/admin/learning/DeleteResourcePanel'
import { supabaseDb as db } from '@/db'
import { lessons } from '@/db/schema/tables/lessons'
import { eq } from 'drizzle-orm'

interface PageProps {
	params: Promise<{ locale: string; lessonId: string }>
}

export default async function DeleteLessonPage({ params }: PageProps) {
	const { locale, lessonId } = await params
	const lesson = await db.query.lessons.findFirst({
		where: eq(lessons.id, lessonId),
	})

	if (!lesson) notFound()

	return (
		<DeleteResourcePanel
			apiPath={`/api/admin/learning/lessons/${lesson.id}`}
			backHref={`/${locale}/admin/learning`}
			resourceLabel="lesson"
			resourceTitle={lesson.title}
		/>
	)
}
