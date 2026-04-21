import { SimpleResourcePage } from '@/components/admin/learning/SimpleResourcePage'
import { supabaseDb as db } from '@/db'

interface PageProps {
	params: Promise<{ locale: string }>
}

export default async function OrganizationsPage({ params }: PageProps) {
	const { locale } = await params
	const organizations = await db.query.organizations.findMany({
		with: {
			lessons: true,
		},
		orderBy: (organizations, { asc }) => [asc(organizations.title)],
	})

	return (
		<SimpleResourcePage
			locale={locale}
			title="Organizations"
			description="Optional lesson affiliations."
			columns={['Title', 'Lessons']}
			basePath="/admin/learning/organizations"
			createHref={`/${locale}/admin/learning/organizations/create`}
			rows={organizations.map((organization) => ({
				id: organization.id,
				cells: [organization.title, String(organization.lessons.length)],
			}))}
			emptyText="No organizations yet."
		/>
	)
}
