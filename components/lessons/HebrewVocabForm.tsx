// components/lessons/HebrewVocabForm.tsx

'use client'

import * as React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import {
	hebrewVocabSchema,
	HebrewVocabFormValues,
} from '@/forms/hebrewVocabSchemas'

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
import { extractYouTubeId } from '@/lib/youtube'
import Image from 'next/image'

export function HebrewVocabForm({
	mode = 'create',
	initialData,
	onSaved,
}: {
	mode?: 'create' | 'update' | 'view'
	initialData?: Partial<HebrewVocabFormValues & { id: string }>
	onSaved?: (vocab?: HebrewVocabFormValues & { id: string }) => void
}) {
	const router = useRouter()
	const pathname = usePathname()
	const locale = pathname.split('/')[1] ?? 'en'
	const [loading, setLoading] = React.useState(false)

	const isReadOnly = mode === 'view'

	const form = useForm({
		resolver: zodResolver(hebrewVocabSchema),
		defaultValues: {
			heb: initialData?.heb ?? '',
			hebNiqqud: initialData?.hebNiqqud ?? '',
			eng: initialData?.eng ?? '',
			engDefinition: initialData?.engDefinition ?? '',
			person: initialData?.person ?? undefined,
			gender: initialData?.gender ?? '',
			number: initialData?.number ?? '',
			partOfSpeech: initialData?.partOfSpeech ?? [],
			ipa: initialData?.ipa ?? '',
			engTransliteration: initialData?.engTransliteration ?? '',
			dictionaryUrl: initialData?.dictionaryUrl ?? '',
			images: initialData?.images ?? [],
			hebAudio: initialData?.hebAudio ?? '',
			synonyms: initialData?.synonyms ?? [],
			antonyms: initialData?.antonyms ?? [],
			strongsNumber: initialData?.strongsNumber ?? '',
			category: initialData?.category ?? '',
			video: initialData?.video ?? '',
		},
	})

	async function onSubmit(values: HebrewVocabFormValues) {
		if (isReadOnly) return
		setLoading(true)

		const url =
			mode === 'create'
				? '/api/hebrew-vocab'
				: `/api/hebrew-vocab/${initialData!.id}`

		const res = await fetch(url, {
			method: mode === 'create' ? 'POST' : 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(values),
		})

		setLoading(false)

		if (!res.ok) {
			console.error(await res.text())
			toast.error('Error saving vocabulary')
			return
		}

		toast.success('Saved!')
		const data = await res.json()
		if (onSaved) onSaved(data.vocab)
	}

	const videoId = extractYouTubeId(form.watch('video'))
	const images = form.watch('images')

	return (
		<Card className="w-full max-w-3xl mx-auto space-y-6">
			<CardHeader>
				<CardTitle>
					{mode === 'create' ? 'Add Vocabulary' : 'Edit Vocabulary'}
				</CardTitle>
			</CardHeader>

			<CardContent>
				<form id="vocab-form" onSubmit={form.handleSubmit(onSubmit)}>
					<FieldGroup className="space-y-6">
						{/* ===== Hebrew ===== */}
						<Controller
							name="heb"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>Hebrew (no niqqud)</FieldLabel>
									<Input disabled={isReadOnly} {...field} dir="rtl" />
									<FieldError errors={[fieldState.error]} />
								</Field>
							)}
						/>

						<Controller
							name="hebNiqqud"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>Hebrew (with niqqud)</FieldLabel>
									<Input disabled={isReadOnly} {...field} dir="rtl" />
									<FieldError errors={[fieldState.error]} />
								</Field>
							)}
						/>

						{/* ===== English ===== */}
						<Controller
							name="eng"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>English Gloss</FieldLabel>
									<Input disabled={isReadOnly} {...field} />
									<FieldError errors={[fieldState.error]} />
								</Field>
							)}
						/>

						<Controller
							name="engDefinition"
							control={form.control}
							render={({ field }) => (
								<Field>
									<FieldLabel>Definition / Notes</FieldLabel>
									<Textarea disabled={isReadOnly} rows={3} {...field} />
								</Field>
							)}
						/>

						{/* ===== Metadata ===== */}
						<Controller
							name="engTransliteration"
							control={form.control}
							render={({ field }) => (
								<Field>
									<FieldLabel>Transliteration</FieldLabel>
									<Input disabled={isReadOnly} {...field} />
								</Field>
							)}
						/>

						<Controller
							name="ipa"
							control={form.control}
							render={({ field }) => (
								<Field>
									<FieldLabel>IPA (optional)</FieldLabel>
									<Input disabled={isReadOnly} {...field} />
								</Field>
							)}
						/>

						{/* ===== Part of Speech ===== */}
						<Controller
							name="partOfSpeech"
							control={form.control}
							render={({ field }) => (
								<Field>
									<FieldLabel>Part of Speech</FieldLabel>
									<Input
										disabled={isReadOnly}
										value={(field.value ?? []).join(', ')}
										onChange={(e) =>
											field.onChange(
												e.target.value
													.split(',')
													.map((v) => v.trim())
													.filter(Boolean)
											)
										}
										placeholder="noun, adjective, verb..."
									/>
									<p className="text-xs text-muted-foreground">
										Comma-separated values
									</p>
								</Field>
							)}
						/>

						{/* ===== Media ===== */}
						<Controller
							name="hebAudio"
							control={form.control}
							render={({ field }) => (
								<Field>
									<FieldLabel>Hebrew Audio URL</FieldLabel>
									<Input disabled={isReadOnly} {...field} />
								</Field>
							)}
						/>

						{/* ===== YouTube Preview ===== */}
						<Controller
							name="video"
							control={form.control}
							render={({ field }) => (
								<Field>
									<FieldLabel>Video (YouTube)</FieldLabel>
									<Input disabled={isReadOnly} {...field} />
									{videoId && (
										<div className="mt-2">
											<iframe
												width="100%"
												height="250"
												src={`https://www.youtube.com/embed/${videoId}`}
											/>
										</div>
									)}
								</Field>
							)}
						/>

						{/* ===== Images ===== */}
						<Controller
							name="images"
							control={form.control}
							render={({ field }) => (
								<Field>
									<FieldLabel>Images (comma separated URLs)</FieldLabel>
									<Input
										disabled={isReadOnly}
										value={(field.value ?? []).join(', ')}
										onChange={(e) =>
											field.onChange(
												e.target.value
													.split(',')
													.map((v) => v.trim())
													.filter(Boolean)
											)
										}
									/>
									{images && images.length > 0 && (
										<div className="flex gap-2 mt-2 flex-wrap">
											{images.map((src) => (
												<Image
													width={120}
													alt={src}
													key={src}
													src={src}
													className="h-20 rounded border"
												/>
											))}
										</div>
									)}
								</Field>
							)}
						/>

						{/* ===== Optional fields ===== */}
						<Controller
							name="strongsNumber"
							control={form.control}
							render={({ field }) => (
								<Field>
									<FieldLabel>Strong&apos;s #</FieldLabel>
									<Input disabled={isReadOnly} {...field} />
								</Field>
							)}
						/>

						<Controller
							name="category"
							control={form.control}
							render={({ field }) => (
								<Field>
									<FieldLabel>Category</FieldLabel>
									<Input disabled={isReadOnly} {...field} />
								</Field>
							)}
						/>
					</FieldGroup>
				</form>
			</CardContent>

			<CardFooter>
				{mode === 'view' ? (
					<Button type="button" onClick={() => onSaved?.()}>
						Close
					</Button>
				) : (
					<Button form="vocab-form" type="submit" disabled={loading}>
						{loading
							? 'Saving…'
							: mode === 'create'
							? 'Add Vocab'
							: 'Save Changes'}
					</Button>
				)}
			</CardFooter>
		</Card>
	)
}
