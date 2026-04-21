'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

type QuizType =
	| 'image_to_audio'
	| 'audio_to_image'
	| 'text_to_audio'
	| 'audio_to_text'
	| 'text_to_image'
	| 'image_to_text'

type MediaKind = 'image' | 'audio' | 'video' | 'document' | 'other'

type MediaAssetOption = {
	id: string
	kind: MediaKind
	label: string
}

type ExistingQuestion = {
	id: string
	title: string
	type: QuizType
}

type DraftAnswer = {
	answerText: string
	answerAssetId: string | null
	isCorrect: boolean
}

interface Props {
	locale: string
	mediaAssets: MediaAssetOption[]
	existingQuestions: ExistingQuestion[]
}

const quizTypes: QuizType[] = [
	'image_to_audio',
	'audio_to_image',
	'text_to_audio',
	'audio_to_text',
	'text_to_image',
	'image_to_text',
]

const typeLabels: Record<QuizType, string> = {
	image_to_audio: 'Image to Audio',
	audio_to_image: 'Audio to Image',
	text_to_audio: 'Text to Audio',
	audio_to_text: 'Audio to Text',
	text_to_image: 'Text to Image',
	image_to_text: 'Image to Text',
}

function splitType(type: QuizType) {
	const [promptKind, answerKind] = type.split('_to_') as [MediaKind | 'text', MediaKind | 'text']
	return { promptKind, answerKind }
}

function emptyAnswers(): DraftAnswer[] {
	return [
		{ answerText: '', answerAssetId: null, isCorrect: true },
		{ answerText: '', answerAssetId: null, isCorrect: false },
	]
}

export function QuizEditorForm({
	locale,
	mediaAssets,
	existingQuestions,
}: Props) {
	const router = useRouter()
	const [title, setTitle] = useState('')
	const [type, setType] = useState<QuizType>('image_to_audio')
	const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([])
	const [draftTitle, setDraftTitle] = useState('')
	const [promptText, setPromptText] = useState('')
	const [promptAssetId, setPromptAssetId] = useState<string | null>(null)
	const [answers, setAnswers] = useState<DraftAnswer[]>(emptyAnswers)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [status, setStatus] = useState<string | null>(null)

	const { promptKind, answerKind } = splitType(type)
	const promptAssets = mediaAssets.filter((asset) => asset.kind === promptKind)
	const answerAssets = mediaAssets.filter((asset) => asset.kind === answerKind)
	const filteredQuestions = existingQuestions.filter(
		(question) => question.type === type
	)

	function resetQuestionDraft(nextType = type) {
		setDraftTitle('')
		setPromptText('')
		setPromptAssetId(null)
		setAnswers(emptyAnswers())
		if (nextType !== type) {
			setSelectedQuestionIds([])
		}
	}

	function setCorrectAnswer(index: number) {
		setAnswers((current) =>
			current.map((answer, answerIndex) => ({
				...answer,
				isCorrect: answerIndex === index,
			}))
		)
	}

	function updateAnswer(index: number, patch: Partial<DraftAnswer>) {
		setAnswers((current) =>
			current.map((answer, answerIndex) =>
				answerIndex === index ? { ...answer, ...patch } : answer
			)
		)
	}

	function addAnswer() {
		setAnswers((current) =>
			current.length >= 6
				? current
				: [...current, { answerText: '', answerAssetId: null, isCorrect: false }]
		)
	}

	function removeAnswer(index: number) {
		setAnswers((current) => {
			if (current.length <= 2) return current
			const next = current.filter((_, answerIndex) => answerIndex !== index)
			return next.some((answer) => answer.isCorrect)
				? next
				: next.map((answer, answerIndex) => ({
						...answer,
						isCorrect: answerIndex === 0,
					}))
		})
	}

	async function createDraftQuestion() {
		if (!draftTitle.trim()) return null

		const payload = {
			title: draftTitle,
			type,
			promptText: promptKind === 'text' ? promptText : null,
			promptAssetId: promptKind === 'text' ? null : promptAssetId,
			answers: answers.map((answer, index) => ({
				answerText: answerKind === 'text' ? answer.answerText : null,
				answerAssetId: answerKind === 'text' ? null : answer.answerAssetId,
				isCorrect: answer.isCorrect,
				sortOrder: index,
			})),
		}

		const res = await fetch('/api/admin/learning/quiz-questions', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		})

		if (!res.ok) {
			const body = await res.json().catch(() => null)
			throw new Error(body?.error || 'Unable to create quiz question')
		}

		const created = (await res.json()) as { id: string }
		return created.id
	}

	async function saveQuiz() {
		setSaving(true)
		setError(null)
		setStatus(null)

		try {
			const newQuestionId = await createDraftQuestion()
			const questionIds = newQuestionId
				? [...selectedQuestionIds, newQuestionId]
				: selectedQuestionIds

			if (!questionIds.length) {
				throw new Error('Select an existing question or create a new one')
			}

			const res = await fetch('/api/admin/learning/quizzes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title, questionIds }),
			})

			if (!res.ok) {
				const body = await res.json().catch(() => null)
				throw new Error(body?.error || 'Unable to create quiz')
			}

			setStatus('Quiz created')
			router.push(`/${locale}/admin/learning/quizzes`)
			router.refresh()
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Unable to create quiz')
		} finally {
			setSaving(false)
		}
	}

	return (
		<div className="space-y-6">
			<div className="space-y-6 rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
				<div className="grid gap-4 md:grid-cols-2">
					<div className="space-y-2">
						<Label htmlFor="title">Quiz Title</Label>
						<Input
							id="title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
						/>
					</div>

					<div className="space-y-2">
						<Label>Question Type</Label>
						<Select
							value={type}
							onValueChange={(value: QuizType) => {
								setType(value)
								resetQuestionDraft(value)
							}}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Select quiz type" />
							</SelectTrigger>
							<SelectContent>
								{quizTypes.map((quizType) => (
									<SelectItem key={quizType} value={quizType}>
										{typeLabels[quizType]}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				<div className="space-y-3">
					<div>
						<Label>Reusable Questions</Label>
						<p className="mt-1 text-sm text-muted-foreground">
							Only questions matching {typeLabels[type]} are shown.
						</p>
					</div>
					<div className="grid gap-2 rounded-2xl border border-dashed p-4 md:grid-cols-2">
						{filteredQuestions.map((question) => (
							<label key={question.id} className="flex items-center gap-2 text-sm">
								<Checkbox
									checked={selectedQuestionIds.includes(question.id)}
									onCheckedChange={(checked) =>
										setSelectedQuestionIds((current) =>
											checked === true
												? [...current, question.id]
												: current.filter((id) => id !== question.id)
										)
									}
								/>
								<span>{question.title}</span>
							</label>
						))}
						{filteredQuestions.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								No reusable questions for this type yet.
							</p>
						) : null}
					</div>
				</div>

				<div className="space-y-4 rounded-2xl border border-border/70 p-4">
					<div>
						<h2 className="font-[family:var(--font-eczar)] text-2xl">
							Create a New Question
						</h2>
						<p className="mt-1 text-sm text-muted-foreground">
							This optional question will be created first, then added to the
							new quiz.
						</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor="draftTitle">Question Title</Label>
						<Input
							id="draftTitle"
							value={draftTitle}
							onChange={(e) => setDraftTitle(e.target.value)}
						/>
					</div>

					<div className="space-y-2">
						<Label>Prompt ({promptKind})</Label>
						{promptKind === 'text' ? (
							<Textarea
								value={promptText}
								onChange={(e) => setPromptText(e.target.value)}
								placeholder="Type the prompt text..."
							/>
						) : (
							<Select
								value={promptAssetId ?? 'none'}
								onValueChange={(value) =>
									setPromptAssetId(value === 'none' ? null : value)
								}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder={`Select ${promptKind} prompt`} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">No prompt selected</SelectItem>
									{promptAssets.map((asset) => (
										<SelectItem key={asset.id} value={asset.id}>
											{asset.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					</div>

					<div className="space-y-3">
						<div className="flex items-center justify-between gap-3">
							<Label>Possible Answers ({answerKind})</Label>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={addAnswer}
								disabled={answers.length >= 6}
							>
								Add Answer
							</Button>
						</div>

						<div className="space-y-3">
							{answers.map((answer, index) => (
								<div
									key={index}
									className="grid gap-3 rounded-xl border border-border/60 p-3 md:grid-cols-[auto_1fr_auto]"
								>
									<label className="flex items-center gap-2 text-sm">
										<Checkbox
											checked={answer.isCorrect}
											onCheckedChange={() => setCorrectAnswer(index)}
										/>
										Correct
									</label>

									{answerKind === 'text' ? (
										<Input
											value={answer.answerText}
											onChange={(e) =>
												updateAnswer(index, { answerText: e.target.value })
											}
											placeholder="Answer text"
										/>
									) : (
										<Select
											value={answer.answerAssetId ?? 'none'}
											onValueChange={(value) =>
												updateAnswer(index, {
													answerAssetId: value === 'none' ? null : value,
												})
											}
										>
											<SelectTrigger className="w-full">
												<SelectValue
													placeholder={`Select ${answerKind} answer`}
												/>
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="none">No answer selected</SelectItem>
												{answerAssets.map((asset) => (
													<SelectItem key={asset.id} value={asset.id}>
														{asset.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									)}

									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => removeAnswer(index)}
										disabled={answers.length <= 2}
									>
										Remove
									</Button>
								</div>
							))}
						</div>
					</div>
				</div>

				{status ? <p className="text-sm text-emerald-700">{status}</p> : null}
				{error ? <p className="text-sm text-destructive">{error}</p> : null}
			</div>

			<div className="flex flex-wrap items-center gap-2">
				<Button asChild variant="outline">
					<Link href={`/${locale}/admin/learning/quizzes`}>
						Back to quizzes
					</Link>
				</Button>
				<Button
					type="button"
					onClick={saveQuiz}
					disabled={saving || !title.trim()}
				>
					{saving ? 'Saving...' : 'Create Quiz'}
				</Button>
			</div>
		</div>
	)
}
