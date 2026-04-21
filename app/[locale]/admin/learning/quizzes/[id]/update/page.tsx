import { ResourceRouteShell } from '@/components/admin/learning/ResourceRouteShell'

export default async function UpdateQuizPage({
	params,
}: {
	params: Promise<{ locale: string }>
}) {
	const { locale } = await params
	return (
		<ResourceRouteShell
			title="Update Quiz"
			description="Quiz editing will move into a focused form here."
			backHref={`/${locale}/admin/learning/quizzes`}
		/>
	)
}
