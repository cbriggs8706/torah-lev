import { CourseEditorForm } from '@/components/admin/learning/CourseEditorForm'
import { supabaseDb as db } from '@/db'

export default async function CreateCoursePage({
	params,
}: {
	params: Promise<{ locale: string }>
}) {
	const { locale } = await params
	const lessons = await db.query.lessons.findMany({
		orderBy: (lessons, { asc }) => [
			asc(lessons.number),
			asc(lessons.title),
		],
	})

	return (
		<div className="space-y-6">
			<div>
				<p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">
					Learning
				</p>
				<h1 className="mt-2 font-[family:var(--font-eczar)] text-4xl">
					Create Course
				</h1>
			</div>
			<CourseEditorForm locale={locale} mode="create" lessons={lessons} />
		</div>
	)
}
