import { ResourceRouteShell } from '@/components/admin/learning/ResourceRouteShell'

export default async function ReadQuizPage({
	params,
}: {
	params: Promise<{ locale: string; id: string }>
}) {
	const { locale, id } = await params
	return (
		<ResourceRouteShell
			title="Read Quiz"
			description="Quiz details will be displayed here."
			backHref={`/${locale}/admin/learning/quizzes`}
			updateHref={`/${locale}/admin/learning/quizzes/${id}/update`}
			deleteHref={`/${locale}/admin/learning/quizzes/${id}/delete`}
			deleteLabel="quiz"
		/>
	)
}
