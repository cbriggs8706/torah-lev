import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { StudyGroupEditorForm } from '@/components/admin/learning/StudyGroupEditorForm'
import { supabaseDb as db } from '@/db'
import { studyGroups } from '@/db/schema/tables/study_groups'

export default async function ReadStudyGroupPage({
	params,
}: {
	params: Promise<{ locale: string; id: string }>
}) {
	const { locale, id } = await params
	const [studyGroup, courses] = await Promise.all([
		db.query.studyGroups.findFirst({
			where: eq(studyGroups.id, id),
			with: {
				studyGroupCourses: true,
			},
		}),
		db.query.courses.findMany({
			orderBy: (courses, { asc }) => [asc(courses.title)],
		}),
	])

	if (!studyGroup) notFound()

	return (
		<div className="space-y-6">
			<div>
				<p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">
					Learning
				</p>
				<h1 className="mt-2 font-[family:var(--font-eczar)] text-4xl">
					Read Study Group
				</h1>
			</div>
			<StudyGroupEditorForm
				locale={locale}
				mode="read"
				initialStudyGroup={{
					id: studyGroup.id,
					title: studyGroup.title,
					activeCourseId: studyGroup.activeCourseId,
					courseIds: studyGroup.studyGroupCourses.map((item) => item.courseId),
				}}
				courses={courses}
				updateHref={`/${locale}/admin/learning/study-groups/${id}/update`}
				deleteHref={`/${locale}/admin/learning/study-groups/${id}/delete`}
				deleteLabel={studyGroup.title}
			/>
		</div>
	)
}
