import { DeleteResourcePanel } from '@/components/admin/learning/DeleteResourcePanel'

export default async function DeleteQuizQuestionPage({
	params,
}: {
	params: Promise<{ locale: string; id: string }>
}) {
	const { locale, id } = await params
	return (
		<DeleteResourcePanel
			apiPath={`/api/admin/learning/quiz-questions/${id}`}
			backHref={`/${locale}/admin/learning/quiz-questions`}
			resourceLabel="quiz question"
			resourceTitle={id}
		/>
	)
}
