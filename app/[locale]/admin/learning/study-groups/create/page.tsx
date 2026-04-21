import { StudyGroupEditorForm } from '@/components/admin/learning/StudyGroupEditorForm'
import { supabaseDb as db } from '@/db'

export default async function CreateStudyGroupPage({
	params,
}: {
	params: Promise<{ locale: string }>
}) {
	const { locale } = await params
	const courses = await db.query.courses.findMany({
		orderBy: (courses, { asc }) => [asc(courses.title)],
	})

	return (
		<div className="space-y-6">
			<div>
				<p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">
					Learning
				</p>
				<h1 className="mt-2 font-[family:var(--font-eczar)] text-4xl">
					Create Study Group
				</h1>
			</div>
			<StudyGroupEditorForm locale={locale} mode="create" courses={courses} />
		</div>
	)
}
