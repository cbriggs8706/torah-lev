import { DeleteResourcePanel } from '@/components/admin/learning/DeleteResourcePanel'

export default async function DeleteQuizPage({
	params,
}: {
	params: Promise<{ locale: string; id: string }>
}) {
	const { locale, id } = await params
	return (
		<DeleteResourcePanel
			apiPath={`/api/admin/learning/quizzes/${id}`}
			backHref={`/${locale}/admin/learning/quizzes`}
			resourceLabel="quiz"
			resourceTitle={id}
		/>
	)
}
