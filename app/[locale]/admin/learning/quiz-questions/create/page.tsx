import { ResourceRouteShell } from '@/components/admin/learning/ResourceRouteShell'

export default async function CreateQuizQuestionPage({
	params,
}: {
	params: Promise<{ locale: string }>
}) {
	const { locale } = await params
	return (
		<ResourceRouteShell
			title="Create Quiz Question"
			description="Quiz question creation will move into a focused form here."
			backHref={`/${locale}/admin/learning/quiz-questions`}
		/>
	)
}
