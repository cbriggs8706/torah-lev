import { ResourceRouteShell } from '@/components/admin/learning/ResourceRouteShell'

export default async function UpdateQuizQuestionPage({
	params,
}: {
	params: Promise<{ locale: string }>
}) {
	const { locale } = await params
	return (
		<ResourceRouteShell
			title="Update Quiz Question"
			description="Quiz question editing will move into a focused form here."
			backHref={`/${locale}/admin/learning/quiz-questions`}
		/>
	)
}
