import { SimpleResourcePage } from '@/components/admin/learning/SimpleResourcePage'
import { supabaseDb as db } from '@/db'

interface PageProps {
	params: Promise<{ locale: string }>
}

export default async function ModulesPage({ params }: PageProps) {
	const { locale } = await params
	const modules = await db.query.modules.findMany({
		orderBy: (modules, { asc }) => [asc(modules.title)],
	})

	return (
		<SimpleResourcePage
			locale={locale}
			title="Modules"
			description="Reusable lesson building blocks: video, audio, document, and quiz."
			columns={['Title', 'Type']}
			basePath="/admin/learning/modules"
			createHref={`/${locale}/admin/learning/modules/create`}
			rows={modules.map((module) => ({
				id: module.id,
				cells: [module.title, module.type],
			}))}
			emptyText="No modules yet."
		/>
	)
}
