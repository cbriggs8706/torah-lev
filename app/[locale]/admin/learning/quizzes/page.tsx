import { SimpleResourcePage } from '@/components/admin/learning/SimpleResourcePage'
import { supabaseDb as db } from '@/db'

interface PageProps {
	params: Promise<{ locale: string }>
}

export default async function QuizzesPage({ params }: PageProps) {
	const { locale } = await params
	const quizzes = await db.query.quizzes.findMany({
		with: {
			questionAssignments: true,
		},
		orderBy: (quizzes, { asc }) => [asc(quizzes.title)],
	})

	return (
		<SimpleResourcePage
			locale={locale}
			title="Quizzes"
			description="Reusable quizzes made from reusable quiz questions."
			columns={['Title', 'Questions']}
			basePath="/admin/learning/quizzes"
			createHref={`/${locale}/admin/learning/quizzes/create`}
			rows={quizzes.map((quiz) => ({
				id: quiz.id,
				cells: [quiz.title, String(quiz.questionAssignments.length)],
			}))}
			emptyText="No quizzes yet."
		/>
	)
}
