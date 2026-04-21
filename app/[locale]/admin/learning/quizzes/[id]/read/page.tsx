import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { CheckCircle2 } from 'lucide-react'
import { LearningPageActions } from '@/components/admin/learning/LearningPageActions'
import { QuizMediaAsset } from '@/components/learning/QuizMediaAsset'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabaseDb as db } from '@/db'
import { quizzes } from '@/db/schema/tables/modules'

export default async function ReadQuizPage({
	params,
}: {
	params: Promise<{ locale: string; id: string }>
}) {
	const { locale, id } = await params
	const quiz = await db.query.quizzes.findFirst({
		where: eq(quizzes.id, id),
		with: {
			questionAssignments: {
				with: {
					question: {
						with: {
							promptAsset: true,
							answers: {
								with: {
									answerAsset: true,
								},
								orderBy: (answers, { asc }) => [asc(answers.sortOrder)],
							},
						},
					},
				},
				orderBy: (assignments, { asc }) => [asc(assignments.sortOrder)],
			},
		},
	})

	if (!quiz) notFound()

	return (
		<div className="space-y-6">
			<div className="rounded-3xl border border-border/60 bg-gradient-to-br from-stone-50 via-background to-amber-50 p-6 shadow-sm">
				<p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">
					Learning
				</p>
				<h1 className="mt-2 font-[family:var(--font-eczar)] text-4xl">
					{quiz.title}
				</h1>
				<p className="mt-3 max-w-2xl text-sm text-muted-foreground">
					{quiz.questionAssignments.length} question
					{quiz.questionAssignments.length === 1 ? '' : 's'} assigned to this
					quiz.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Questions and Answers</CardTitle>
					<CardDescription>
						Review each question prompt and its answer choices.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{quiz.questionAssignments.map((assignment, index) => {
						const question = assignment.question

						return (
							<div
								key={question.id}
								className="rounded-2xl border border-border/70 bg-background/70 p-4"
							>
								<div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
									<div>
										<p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
											Question {index + 1}
										</p>
										<h2 className="mt-1 font-[family:var(--font-eczar)] text-2xl font-semibold">
											{question.title}
										</h2>
									</div>
									<Badge variant="secondary">{question.type}</Badge>
								</div>

								<div className="mt-4 rounded-xl border border-dashed border-border/80 p-3">
									<p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
										Prompt
									</p>
									<div className="mt-2">
										{question.promptText ? (
											<p className="text-sm">{question.promptText}</p>
										) : question.promptAsset ? (
											<QuizMediaAsset asset={question.promptAsset} />
										) : (
											<p className="text-sm text-muted-foreground">No prompt</p>
										)}
									</div>
								</div>

								<div className="mt-4 grid gap-2 md:grid-cols-2">
									{question.answers.map((answer) => {
										return (
											<div
												key={answer.id}
												className="rounded-xl border border-border/70 bg-card p-3 text-sm"
											>
												<div className="flex items-start justify-between gap-3">
													<div className="min-w-0 flex-1">
														{answer.answerText ? (
															<span>{answer.answerText}</span>
														) : answer.answerAsset ? (
															<QuizMediaAsset asset={answer.answerAsset} />
														) : (
															<span className="text-muted-foreground">
																Untitled answer
															</span>
														)}
													</div>
													{answer.isCorrect ? (
														<span className="flex shrink-0 items-center gap-1 text-emerald-700">
															<CheckCircle2 className="h-4 w-4" />
															Correct
														</span>
													) : null}
												</div>
											</div>
										)
									})}
								</div>
							</div>
						)
					})}

					{quiz.questionAssignments.length === 0 ? (
						<p className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
							No questions are assigned to this quiz yet.
						</p>
					) : null}
				</CardContent>
			</Card>

			<LearningPageActions
				backHref={`/${locale}/admin/learning/quizzes`}
				backLabel="Back to quizzes"
				updateHref={`/${locale}/admin/learning/quizzes/${id}/update`}
				deleteHref={`/${locale}/admin/learning/quizzes/${id}/delete`}
				deleteLabel={quiz.title}
			/>
		</div>
	)
}
