import { LessonEditorForm } from '@/components/admin/learning/LessonEditorForm'
import { supabaseDb as db } from '@/db'

interface PageProps {
	params: Promise<{ locale: string }>
}

export default async function CreateLessonPage({ params }: PageProps) {
	const { locale } = await params
	const [courses, organizations, targetLanguages, modules, quizzes] = await Promise.all([
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

	return (
		<div className="space-y-6">
			<div>
				<p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">
					Learning
				</p>
				<h1 className="mt-2 font-[family:var(--font-eczar)] text-4xl">
					Create Lesson
				</h1>
			</div>
			<LessonEditorForm
				locale={locale}
				mode="create"
				courses={courses}
				organizations={organizations}
				targetLanguages={targetLanguages}
				modules={modules}
				quizzes={quizzes}
			/>
		</div>
	)
}
