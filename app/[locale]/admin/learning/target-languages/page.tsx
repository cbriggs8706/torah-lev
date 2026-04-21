import { SimpleResourcePage } from '@/components/admin/learning/SimpleResourcePage'
import { supabaseDb as db } from '@/db'

interface PageProps {
	params: Promise<{ locale: string }>
}

export default async function TargetLanguagesPage({ params }: PageProps) {
	const { locale } = await params
	const targetLanguages = await db.query.targetLanguages.findMany({
		with: {
			lessons: true,
		},
		orderBy: (targetLanguages, { asc }) => [asc(targetLanguages.name)],
	})

	return (
		<SimpleResourcePage
			locale={locale}
			title="Target Languages"
			description="The required target language for each lesson."
			columns={['Name', 'Lessons']}
			basePath="/admin/learning/target-languages"
			createHref={`/${locale}/admin/learning/target-languages/create`}
			rows={targetLanguages.map((language) => ({
				id: language.id,
				cells: [language.name, String(language.lessons.length)],
			}))}
			emptyText="No target languages yet."
		/>
	)
}
