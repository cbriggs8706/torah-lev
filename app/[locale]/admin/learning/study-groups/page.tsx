import { SimpleResourcePage } from '@/components/admin/learning/SimpleResourcePage'
import { supabaseDb as db } from '@/db'

interface PageProps {
	params: Promise<{ locale: string }>
}

export default async function StudyGroupsPage({ params }: PageProps) {
	const { locale } = await params
	const studyGroups = await db.query.studyGroups.findMany({
		with: {
			activeCourse: true,
			studyGroupCourses: true,
		},
		orderBy: (studyGroups, { asc }) => [asc(studyGroups.title)],
	})

	return (
		<SimpleResourcePage
			locale={locale}
			title="Study Groups"
			description="Long-lived groups that can access old, current, and future courses."
			columns={['Title', 'Active Course', 'Assigned Courses']}
			basePath="/admin/learning/study-groups"
			createHref={`/${locale}/admin/learning/study-groups/create`}
			rows={studyGroups.map((group) => ({
				id: group.id,
				cells: [
					group.title,
					group.activeCourse?.title ?? 'None',
					String(group.studyGroupCourses.length),
				],
			}))}
			emptyText="No study groups yet."
		/>
	)
}
