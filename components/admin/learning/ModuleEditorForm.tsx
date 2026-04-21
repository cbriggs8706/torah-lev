'use client'

import { useState } from 'react'
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

type ModuleType = 'video' | 'audio' | 'document' | 'quiz'

type MediaAssetOption = {
	id: string
	label: string
	kind: string
}

type Option = {
	id: string
	title: string
}

type ModuleFormValue = {
	id?: string
	title: string
	type: ModuleType
	mediaAssetId: string | null
	externalUrl: string
	quizId: string | null
	lessonIds: string[]
}

interface Props {
	locale: string
	mode: 'create' | 'read' | 'update'
	initialModule?: ModuleFormValue
	mediaAssets: MediaAssetOption[]
	quizzes: Option[]
	lessons: Option[]
	showFooterActions?: boolean
}

const moduleTypes: ModuleType[] = ['video', 'audio', 'document', 'quiz']

export function ModuleEditorForm({
	locale,
	mode,
	initialModule,
	mediaAssets,
	quizzes,
	lessons,
	showFooterActions = true,
}: Props) {
	const router = useRouter()
	const readOnly = mode === 'read'
	const [status, setStatus] = useState<string | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [saving, setSaving] = useState(false)
	const [module, setModule] = useState<ModuleFormValue>(
		initialModule ?? {
			title: '',
			type: 'video',
			mediaAssetId: null,
			externalUrl: '',
			quizId: null,
			lessonIds: [],
		}
	)

	const compatibleAssets = mediaAssets.filter((asset) => {
		if (module.type === 'quiz') return false
		return asset.kind === module.type
	})

	async function save() {
		setSaving(true)
		setStatus(null)
		setError(null)

		try {
			const url =
				mode === 'create'
					? '/api/admin/learning/modules'
					: `/api/admin/learning/modules/${module.id}`
			const method = mode === 'create' ? 'POST' : 'PATCH'
			const payload = {
				...module,
				mediaAssetId: module.mediaAssetId || null,
				externalUrl: module.externalUrl.trim() || null,
				quizId: module.quizId || null,
			}

			const res = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			})

			if (!res.ok) {
				const body = await res.json().catch(() => null)
				throw new Error(body?.error || 'Unable to save module')
			}

			setStatus(mode === 'create' ? 'Module created' : 'Module saved')
			router.push(`/${locale}/admin/learning/modules`)
			router.refresh()
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Unable to save module')
		} finally {
			setSaving(false)
		}
	}

	return (
		<div className="space-y-6">
			<div className="space-y-6 rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
				<div className="grid gap-4 md:grid-cols-2">
					<div className="space-y-2">
						<Label htmlFor="title">Title</Label>
						<Input
							id="title"
							value={module.title}
							disabled={readOnly}
							onChange={(e) =>
								setModule((current) => ({
									...current,
									title: e.target.value,
								}))
							}
						/>
					</div>

					<div className="space-y-2">
						<Label>Type</Label>
						<Select
							value={module.type}
							disabled={readOnly}
							onValueChange={(value: ModuleType) =>
								setModule((current) => ({
									...current,
									type: value,
									mediaAssetId: null,
									externalUrl: value === 'video' ? current.externalUrl : '',
									quizId: value === 'quiz' ? current.quizId : null,
								}))
							}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Select module type" />
							</SelectTrigger>
							<SelectContent>
								{moduleTypes.map((type) => (
									<SelectItem key={type} value={type}>
										{type}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{module.type !== 'quiz' ? (
						<div className="space-y-2">
							<Label>Media Asset</Label>
							<Select
								value={module.mediaAssetId ?? 'none'}
								disabled={readOnly}
								onValueChange={(value) =>
									setModule((current) => ({
										...current,
										mediaAssetId: value === 'none' ? null : value,
									}))
								}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select media asset" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">No media asset</SelectItem>
									{compatibleAssets.map((asset) => (
										<SelectItem key={asset.id} value={asset.id}>
											{asset.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					) : null}

					{module.type === 'video' ? (
						<div className="space-y-2">
							<Label htmlFor="externalUrl">External URL</Label>
							<Input
								id="externalUrl"
								type="url"
								value={module.externalUrl}
								disabled={readOnly}
								placeholder="https://..."
								onChange={(e) =>
									setModule((current) => ({
										...current,
										externalUrl: e.target.value,
									}))
								}
							/>
						</div>
					) : null}

					{module.type === 'quiz' ? (
						<div className="space-y-2">
							<Label>Quiz</Label>
							<Select
								value={module.quizId ?? 'none'}
								disabled={readOnly}
								onValueChange={(value) =>
									setModule((current) => ({
										...current,
										quizId: value === 'none' ? null : value,
									}))
								}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select quiz" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">No quiz</SelectItem>
									{quizzes.map((quiz) => (
										<SelectItem key={quiz.id} value={quiz.id}>
											{quiz.title}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					) : null}
				</div>

				<div className="space-y-3">
					<div>
						<Label>Lessons</Label>
						<p className="mt-1 text-sm text-muted-foreground">
							Select lessons that use this module.
						</p>
					</div>
					<div className="grid gap-2 rounded-2xl border border-dashed p-4 md:grid-cols-2">
						{lessons.map((lesson) => (
							<label key={lesson.id} className="flex items-center gap-2 text-sm">
								<Checkbox
									disabled={readOnly}
									checked={module.lessonIds.includes(lesson.id)}
									onCheckedChange={(checked) =>
										setModule((current) => ({
											...current,
											lessonIds:
												checked === true
													? [...current.lessonIds, lesson.id]
													: current.lessonIds.filter((id) => id !== lesson.id),
										}))
									}
								/>
								<span>{lesson.title}</span>
							</label>
						))}
						{lessons.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								No lessons exist yet.
							</p>
						) : null}
					</div>
				</div>

				{status ? <p className="text-sm text-emerald-700">{status}</p> : null}
				{error ? <p className="text-sm text-destructive">{error}</p> : null}
			</div>

			{showFooterActions ? (
				<div className="flex flex-wrap gap-3">
					<Button
						type="button"
						variant="outline"
						onClick={() => router.push(`/${locale}/admin/learning/modules`)}
					>
						Back to modules
					</Button>
					{!readOnly ? (
						<Button
							type="button"
							onClick={save}
							disabled={saving || !module.title.trim()}
						>
							{saving ? 'Saving...' : 'Save Module'}
						</Button>
					) : null}
				</div>
			) : null}
		</div>
	)
}
