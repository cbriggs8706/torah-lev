import { notFound } from 'next/navigation'
import { LessonEditorForm } from '@/components/admin/learning/LessonEditorForm'
import { supabaseDb as db } from '@/db'
import { lessons } from '@/db/schema/tables/lessons'
import { eq } from 'drizzle-orm'

interface PageProps {
	params: Promise<{ locale: string; lessonId: string }>
}

export default async function UpdateLessonPage({ params }: PageProps) {
	const { locale, lessonId } = await params
	const [lesson, courses, organizations, targetLanguages, modules, quizzes] =
		await Promise.all([
			db.query.lessons.findFirst({
				where: eq(lessons.id, lessonId),
				with: {
					moduleAssignments: {
						orderBy: (lessonModules, { asc }) => [
							asc(lessonModules.sortOrder),
						],
					},
				},
			}),
			db.query.courses.findMany({
				orderBy: (courses, { asc }) => [asc(courses.title)],
			}),
			db.query.organizations.findMany({
				orderBy: (organizations, { asc }) => [asc(organizations.title)],
			}),
			db.query.targetLanguages.findMany({
				orderBy: (targetLanguages, { asc }) => [asc(targetLanguages.name)],
			}),
			db.query.modules.findMany({
				orderBy: (modules, { asc }) => [asc(modules.title)],
			}),
			db.query.quizzes.findMany({
				orderBy: (quizzes, { asc }) => [asc(quizzes.title)],
			}),
		])

	if (!lesson) notFound()

	return (
		<div className="space-y-6">
			<div>
				<p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">
					Learning
				</p>
				<h1 className="mt-2 font-[family:var(--font-eczar)] text-4xl">
					Update Lesson
				</h1>
			</div>
			<LessonEditorForm
				locale={locale}
				mode="update"
				initialLesson={{
					id: lesson.id,
					title: lesson.title,
					number: lesson.number,
					part: lesson.part,
					sortOrder: lesson.sortOrder,
					courseId: lesson.courseId,
					organizationId: lesson.organizationId,
					targetLanguageId: lesson.targetLanguageId,
					moduleIds: lesson.moduleAssignments.map((item) => item.moduleId),
				}}
				courses={courses}
				organizations={organizations}
				targetLanguages={targetLanguages}
				modules={modules}
				quizzes={quizzes}
			/>
		</div>
	)
}
