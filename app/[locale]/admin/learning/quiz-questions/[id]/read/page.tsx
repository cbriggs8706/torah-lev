import { ResourceRouteShell } from '@/components/admin/learning/ResourceRouteShell'

export default async function ReadQuizQuestionPage({
	params,
}: {
	params: Promise<{ locale: string; id: string }>
}) {
	const { locale, id } = await params
	return (
		<ResourceRouteShell
			title="Read Quiz Question"
			description="Quiz question details will be displayed here."
			backHref={`/${locale}/admin/learning/quiz-questions`}
			updateHref={`/${locale}/admin/learning/quiz-questions/${id}/update`}
			deleteHref={`/${locale}/admin/learning/quiz-questions/${id}/delete`}
			deleteLabel="quiz question"
		/>
	)
}
