import { QuizEditorForm } from '@/components/admin/learning/QuizEditorForm'
import { supabaseDb as db } from '@/db'

export default async function CreateQuizPage({
	params,
}: {
	params: Promise<{ locale: string }>
}) {
	const { locale } = await params
	const [mediaAssets, questions] = await Promise.all([
		db.query.mediaAssets.findMany({
			orderBy: (mediaAssets, { asc }) => [
				asc(mediaAssets.kind),
				asc(mediaAssets.title),
				asc(mediaAssets.fileName),
			],
		}),
		db.query.quizQuestions.findMany({
			orderBy: (quizQuestions, { asc }) => [
				asc(quizQuestions.type),
				asc(quizQuestions.title),
			],
		}),
	])

	return (
		<div className="space-y-6">
			<div>
				<p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">
					Learning
				</p>
				<h1 className="mt-2 font-[family:var(--font-eczar)] text-4xl">
					Create Quiz
				</h1>
			</div>
			<QuizEditorForm
				locale={locale}
				mediaAssets={mediaAssets.map((asset) => ({
					id: asset.id,
					kind: asset.kind,
					label: asset.title || asset.fileName,
				}))}
				existingQuestions={questions.map((question) => ({
					id: question.id,
					title: question.title,
					type: question.type,
				}))}
			/>
		</div>
	)
}
