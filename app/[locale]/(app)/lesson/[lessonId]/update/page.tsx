// app/[locale]/(app)/lesson/[lessonId]/update/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { supabaseDb as db } from '@/db/client'
import { lessons } from '@/db/schema/tables/lessons'
import { eq } from 'drizzle-orm'
import { LessonForm } from '@/components/lessons/LessonForm'
import { getTranslations } from 'next-intl/server'

interface PageProps {
	params: Promise<{ locale: string; lessonId: string }>
}

export default async function UpdateLessonPage({ params }: PageProps) {
	const { locale, lessonId } = await params
	const session = await getServerSession(authOptions)

	if (!session) {
		redirect(`/${locale}/login`)
	}

	const t = await getTranslations({ locale, namespace: 'lessons' })

	const lesson = await db
		.select()
		.from(lessons)
		.where(eq(lessons.id, lessonId))
		.then((rows) => rows[0])

	if (!lesson) {
		notFound()
	}

	const initialData = {
		...lesson,
		// Convert null → undefined for form compatibility
		video: lesson.video ?? undefined,
		secondaryVideo: lesson.secondaryVideo ?? undefined,
		lessonScript: lesson.lessonScript ?? undefined,
		grammarLesson: lesson.grammarLesson ?? undefined,
		image: lesson.image ?? undefined,
		description: lesson.description ?? undefined,
	}

	return (
		<div className="py-8">
			<h1 className="text-2xl font-bold mb-4">Edit Lesson</h1>
			{/* <h1 className="text-2xl font-bold mb-4">{t('editLesson')}</h1> */}
			<LessonForm mode="update" initialData={initialData} />
		</div>
	)
}
