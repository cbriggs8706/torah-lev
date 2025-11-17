// components/lessons/LessonForm.tsx
'use client'

import * as React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { lessonFormSchema, LessonFormValues } from '@/forms/lessonSchemas'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
	CardFooter,
} from '@/components/ui/card'
import {
	Field,
	FieldGroup,
	FieldLabel,
	FieldError,
} from '@/components/ui/field'
import { toast } from 'sonner'
import { HebrewVocabSelector } from './HebrewVocabSelector'
import { PlusCircle } from 'lucide-react'

// NEW
import { extractYouTubeId } from '@/lib/youtube'
import { HebrewVocabInlineEditor } from './HebrewVocabInlineEditor'
import Image from 'next/image'
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog'

export function LessonForm({
	mode = 'create',
	initialData,
}: {
	mode?: 'create' | 'update' | 'view'
	initialData?: Partial<LessonFormValues & { id: string }>
}) {
	const pathname = usePathname()
	const locale = pathname.split('/')[1] ?? 'en'
	const router = useRouter()
	const [loading, setLoading] = React.useState(false)
	const [showVocabEditor, setShowVocabEditor] = React.useState(false)

	const isReadOnly = mode === 'view'

	const form = useForm({
		resolver: zodResolver(lessonFormSchema),
		defaultValues: {
			slug: initialData?.slug ?? '',
			lessonNumber: initialData?.lessonNumber ?? '',
			description: initialData?.description ?? '',
			unitId: initialData?.unitId ?? '',
			video: initialData?.video ?? '',
			secondaryVideo: initialData?.secondaryVideo ?? '',
			lessonScript: initialData?.lessonScript ?? '',
			grammarLesson: initialData?.grammarLesson ?? '',
			image: initialData?.image ?? '',
			vocabIds: initialData?.vocabIds ?? [],
		},
	})

	async function onSubmit(values: LessonFormValues) {
		if (isReadOnly) return
		setLoading(true)

		let res: Response
		const url =
			mode === 'create' ? '/api/lessons' : `/api/lessons/${initialData!.id}`

		res = await fetch(url, {
			method: mode === 'create' ? 'POST' : 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(values),
		})

		setLoading(false)

		if (!res.ok) {
			console.error(await res.text())
			toast.error('Error saving lesson')
			return
		}

		router.push(`/${locale}/lessons`)
	}

	// Live YouTube preview
	const video = form.watch('video')
	const videoId = extractYouTubeId(video)

	const secondaryVideo = form.watch('secondaryVideo')
	const secondaryVideoId = extractYouTubeId(secondaryVideo)

	// const videoId = React.useMemo(
	// 	() => extractYouTubeId(form.watch('video')),
	// 	[form.watch('video')]
	// )
	// const secondaryVideoId = React.useMemo(
	// 	() => extractYouTubeId(form.watch('secondaryVideo')),
	// 	[form.watch('secondaryVideo')]
	// )

	const imageUrl = form.watch('image')

	return (
		<Card className="w-full max-w-4xl mx-auto space-y-6">
			<CardHeader>
				<CardTitle className="text-2xl font-bold">
					{mode === 'create' ? 'Create Lesson' : 'Edit Lesson'}
				</CardTitle>
			</CardHeader>

			<CardContent>
				<form id="lesson-form" onSubmit={form.handleSubmit(onSubmit)}>
					<FieldGroup className="space-y-6">
						{/* ===== MAIN INFO ===== */}
						<Controller
							name="slug"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>Slug</FieldLabel>
									<Input disabled={isReadOnly} {...field} />
									<FieldError errors={[fieldState.error]} />
								</Field>
							)}
						/>

						<Controller
							name="lessonNumber"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>Lesson Number</FieldLabel>
									<Input disabled={isReadOnly} {...field} />
									<FieldError errors={[fieldState.error]} />
								</Field>
							)}
						/>

						<Controller
							name="description"
							control={form.control}
							render={({ field }) => (
								<Field>
									<FieldLabel>Description</FieldLabel>
									<Textarea disabled={isReadOnly} rows={3} {...field} />
								</Field>
							)}
						/>

						{/* ===== VIDEO FIELDS ===== */}
						<Controller
							name="video"
							control={form.control}
							render={({ field }) => (
								<Field>
									<FieldLabel>Main Video (YouTube URL)</FieldLabel>
									<Input disabled={isReadOnly} {...field} />
									{videoId && (
										<div className="mt-2">
											<iframe
												width="100%"
												height="250"
												src={`https://www.youtube.com/embed/${videoId}`}
												allowFullScreen
											/>
										</div>
									)}
								</Field>
							)}
						/>

						<Controller
							name="secondaryVideo"
							control={form.control}
							render={({ field }) => (
								<Field>
									<FieldLabel>Secondary Video (Optional)</FieldLabel>
									<Input disabled={isReadOnly} {...field} />
									{secondaryVideoId && (
										<div className="mt-2">
											<iframe
												width="100%"
												height="250"
												src={`https://www.youtube.com/embed/${secondaryVideoId}`}
												allowFullScreen
											/>
										</div>
									)}
								</Field>
							)}
						/>

						{/* ===== IMAGE PREVIEW ===== */}
						<Controller
							name="image"
							control={form.control}
							render={({ field }) => (
								<Field>
									<FieldLabel>Image URL</FieldLabel>
									<Input disabled={isReadOnly} {...field} />
									{imageUrl && (
										<Image
											src={imageUrl}
											width={240}
											height={120}
											alt="Lesson image preview"
											className="mt-2 max-h-48 rounded border"
										/>
									)}
								</Field>
							)}
						/>

						{/* ===== SCRIPT & GRAMMAR ===== */}
						<Controller
							name="lessonScript"
							control={form.control}
							render={({ field }) => (
								<Field>
									<FieldLabel>Lesson Script (Markdown)</FieldLabel>
									<Textarea disabled={isReadOnly} rows={6} {...field} />
								</Field>
							)}
						/>

						<Controller
							name="grammarLesson"
							control={form.control}
							render={({ field }) => (
								<Field>
									<FieldLabel>Grammar Notes (Markdown)</FieldLabel>
									<Textarea disabled={isReadOnly} rows={6} {...field} />
								</Field>
							)}
						/>

						{/* ===== VOCAB SELECTOR ===== */}
						<Controller
							name="vocabIds"
							control={form.control}
							render={({ field }) => (
								<Field>
									<FieldLabel>Vocabulary in this Lesson</FieldLabel>
									<HebrewVocabSelector
										value={field.value ?? []}
										onChange={field.onChange}
										disabled={isReadOnly}
									/>

									<Button
										type="button"
										variant="outline"
										size="sm"
										className="mt-2"
										onClick={() => setShowVocabEditor(true)}
										disabled={isReadOnly}
									>
										<PlusCircle className="w-4 h-4 mr-2" />
										Add or Edit Vocabulary
									</Button>
								</Field>
							)}
						/>
					</FieldGroup>
				</form>

				{/* Inline vocab editor dialog */}
				{/* {showVocabEditor && (
					<HebrewVocabInlineEditor
						onClose={() => setShowVocabEditor(false)}
						onSaved={() => {
							toast.success('Vocabulary saved!')
							setShowVocabEditor(false)
						}}
					/>
				)} */}
				<Dialog open={showVocabEditor} onOpenChange={setShowVocabEditor}>
					<DialogTitle className="hidden">Vocab Editor</DialogTitle>
					<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6">
						<HebrewVocabInlineEditor
							onSaved={(vocab) => {
								if (!vocab) return // <-- prevent crash if closed

								toast.success('Vocabulary saved!')
								setShowVocabEditor(false)

								const existing = form.getValues('vocabIds') ?? []
								if (!existing.includes(vocab.id)) {
									form.setValue('vocabIds', [...existing, vocab.id])
								}

								router.refresh()
							}}
						/>
					</DialogContent>
				</Dialog>
			</CardContent>

			<CardFooter>
				{mode === 'view' ? (
					<Button
						type="button"
						onClick={() => router.push(`/${locale}/lessons`)}
					>
						Back to Lessons
					</Button>
				) : (
					<Button form="lesson-form" type="submit" disabled={loading}>
						{loading
							? 'Saving…'
							: mode === 'create'
							? 'Create Lesson'
							: 'Save Lesson'}
					</Button>
				)}
			</CardFooter>
		</Card>
	)
}
