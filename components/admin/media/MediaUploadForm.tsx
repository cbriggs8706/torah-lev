'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import type { MediaLibraryFolder } from '@/lib/media/library'

type BatchUploadItem = {
	id: string
	file: File
	title: string
	description: string
	altText: string
	kind: string
}

function formatBytes(size: number) {
	const units = ['B', 'KB', 'MB', 'GB']
	let value = size
	let index = 0
	while (value >= 1024 && index < units.length - 1) {
		value /= 1024
		index += 1
	}
	return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`
}

export function MediaUploadForm({
	locale,
	folders,
}: {
	locale: string
	folders: MediaLibraryFolder[]
}) {
	const router = useRouter()
	const [saving, setSaving] = useState(false)
	const [uploadItems, setUploadItems] = useState<BatchUploadItem[]>([])
	const [uploadFolderId, setUploadFolderId] = useState('root')
	const [uploadTags, setUploadTags] = useState('')

	function buildBatchUploadItems(files: FileList | null) {
		if (!files || files.length === 0) {
			setUploadItems([])
			return
		}

		setUploadItems(
			Array.from(files).map((file, index) => ({
				id: `${file.name}-${file.size}-${index}`,
				file,
				title: file.name.replace(/\.[^.]+$/, ''),
				description: '',
				altText: '',
				kind: 'auto',
			}))
		)
	}

	function updateUploadItem(
		itemId: string,
		field: keyof Omit<BatchUploadItem, 'id' | 'file'>,
		value: string
	) {
		setUploadItems((current) =>
			current.map((item) =>
				item.id === itemId ? { ...item, [field]: value } : item
			)
		)
	}

	function removeUploadItem(itemId: string) {
		setUploadItems((current) => current.filter((item) => item.id !== itemId))
	}

	async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault()
		if (uploadItems.length === 0) {
			toast.error('Choose one or more files to upload.')
			return
		}

		setSaving(true)

		try {
			for (const item of uploadItems) {
				const formData = new FormData()
				formData.set('file', item.file)
				formData.set('title', item.title)
				formData.set('description', item.description)
				formData.set('altText', item.altText)
				formData.set('folderId', uploadFolderId === 'root' ? '' : uploadFolderId)
				formData.set('kind', item.kind)
				formData.set('tags', uploadTags)

				const res = await fetch('/api/admin/media', {
					method: 'POST',
					body: formData,
				})

				if (!res.ok) {
					const body = await res.json().catch(() => null)
					throw new Error(body?.error || `Upload failed for ${item.file.name}.`)
				}
			}

			toast.success(
				uploadItems.length === 1
					? '1 media item uploaded.'
					: `${uploadItems.length} media items uploaded.`
			)
			router.push(`/${locale}/admin/media`)
			router.refresh()
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Upload failed.')
		} finally {
			setSaving(false)
		}
	}

	return (
		<Card>
			<CardContent className="p-6">
				<form className="space-y-6" onSubmit={handleUpload}>
					<div className="space-y-2">
						<Label htmlFor="media-file">Files</Label>
						<Input
							id="media-file"
							type="file"
							multiple
							onChange={(event) => buildBatchUploadItems(event.target.files)}
						/>
						<p className="text-base text-muted-foreground">
							Choose several files, then name each one before uploading.
						</p>
					</div>
					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label>Folder</Label>
							<Select value={uploadFolderId} onValueChange={setUploadFolderId}>
								<SelectTrigger>
									<SelectValue placeholder="Root" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="root">Root</SelectItem>
									{folders.map((folder) => (
										<SelectItem key={folder.id} value={folder.id}>
											{folder.pathLabel}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="media-tags">Tags</Label>
							<Input
								id="media-tags"
								value={uploadTags}
								onChange={(event) => setUploadTags(event.target.value)}
								placeholder="hebrew, pronunciation, lesson 3"
							/>
						</div>
					</div>
					{uploadItems.length > 0 ? (
						<div className="space-y-3 rounded-2xl border bg-muted/20 p-4">
							<div>
								<p className="font-medium">Batch details</p>
								<p className="text-base text-muted-foreground">
									Review and rename each file before upload.
								</p>
							</div>
							<div className="space-y-3">
								{uploadItems.map((item) => (
									<div key={item.id} className="rounded-2xl border bg-background p-4">
										<div className="flex items-start justify-between gap-3">
											<div className="min-w-0">
												<p className="truncate text-base font-medium">
													{item.file.name}
												</p>
												<p className="text-sm text-muted-foreground">
													{formatBytes(item.file.size)} •{' '}
													{item.file.type || 'Unknown type'}
												</p>
											</div>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onClick={() => removeUploadItem(item.id)}
											>
												Remove
											</Button>
										</div>
										<div className="mt-4 grid gap-4 md:grid-cols-2">
											<div className="space-y-2">
												<Label htmlFor={`upload-title-${item.id}`}>Title</Label>
												<Input
													id={`upload-title-${item.id}`}
													value={item.title}
													onChange={(event) =>
														updateUploadItem(item.id, 'title', event.target.value)
													}
												/>
											</div>
											<div className="space-y-2">
												<Label>Kind</Label>
												<Select
													value={item.kind}
													onValueChange={(value) =>
														updateUploadItem(item.id, 'kind', value)
													}
												>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="auto">Auto-detect</SelectItem>
														<SelectItem value="image">Image</SelectItem>
														<SelectItem value="audio">Audio</SelectItem>
														<SelectItem value="video">Video</SelectItem>
														<SelectItem value="document">Document</SelectItem>
														<SelectItem value="other">Other</SelectItem>
													</SelectContent>
												</Select>
											</div>
											<div className="space-y-2">
												<Label htmlFor={`upload-description-${item.id}`}>
													Description
												</Label>
												<Textarea
													id={`upload-description-${item.id}`}
													value={item.description}
													onChange={(event) =>
														updateUploadItem(
															item.id,
															'description',
															event.target.value
														)
													}
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor={`upload-alt-${item.id}`}>Alt text</Label>
												<Input
													id={`upload-alt-${item.id}`}
													value={item.altText}
													onChange={(event) =>
														updateUploadItem(item.id, 'altText', event.target.value)
													}
												/>
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					) : null}
					<div className="flex gap-3">
						<Button type="submit" disabled={saving}>
							{saving
								? 'Uploading...'
								: uploadItems.length > 1
									? `Upload ${uploadItems.length} Items`
									: 'Upload to Library'}
						</Button>
						<Button
							type="button"
							variant="outline"
							onClick={() => router.push(`/${locale}/admin/media`)}
						>
							Cancel
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	)
}
