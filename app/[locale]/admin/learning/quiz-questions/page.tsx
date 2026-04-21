import { SimpleResourcePage } from '@/components/admin/learning/SimpleResourcePage'
import { supabaseDb as db } from '@/db'

const typeLabels: Record<string, string> = {
	image_to_audio: 'Image to Audio',
	audio_to_image: 'Audio to Image',
	text_to_audio: 'Text to Audio',
	audio_to_text: 'Audio to Text',
	text_to_image: 'Text to Image',
	image_to_text: 'Image to Text',
}

interface PageProps {
	params: Promise<{ locale: string }>
}

export default async function QuizQuestionsPage({ params }: PageProps) {
	const { locale } = await params
	const questions = await db.query.quizQuestions.findMany({
		with: {
			answers: true,
		},
		orderBy: (quizQuestions, { asc }) => [asc(quizQuestions.title)],
	})

	return (
		<SimpleResourcePage
			locale={locale}
			title="Quiz Questions"
			description="Reusable one-question prompts with one correct answer and up to five distractors."
			columns={['Title', 'Type', 'Answers']}
			basePath="/admin/learning/quiz-questions"
			createHref={`/${locale}/admin/learning/quiz-questions/create`}
			rows={questions.map((question) => ({
				id: question.id,
				cells: [
					question.title,
					typeLabels[question.type] ?? question.type,
					String(question.answers.length),
				],
			}))}
			emptyText="No quiz questions yet."
		/>
	)
}
