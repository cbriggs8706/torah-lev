'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
	AudioLines,
	Copy,
	FileText,
	FolderClosed,
	FolderPlus,
	ImageIcon,
	Loader2,
	Plus,
	Search,
	Tag,
	Trash2,
	Video,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import type {
	MediaLibraryAsset,
	MediaLibraryFolder,
} from '@/lib/media/library'

type TagOption = {
	id: string
	name: string
	slug: string
	createdBy: string | null
	createdAt: Date
}

type BatchUploadItem = {
	id: string
	file: File
	title: string
	description: string
	altText: string
	kind: string
}

function formatBytes(size: number | null) {
	if (!size) return 'Unknown size'
	const units = ['B', 'KB', 'MB', 'GB']
	let value = size
	let index = 0
	while (value >= 1024 && index < units.length - 1) {
		value /= 1024
		index += 1
	}
	return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`
}

function formatDate(value: Date | string | null) {
	if (!value) return ''
	return new Date(value).toLocaleString()
}

function getKindIcon(kind: string) {
	switch (kind) {
		case 'image':
			return ImageIcon
		case 'audio':
			return AudioLines
		case 'video':
			return Video
		default:
			return FileText
	}
}

function AssetPreview({
	asset,
	className,
}: {
	asset: MediaLibraryAsset
	className?: string
}) {
	if (asset.kind === 'image') {
		return (
			<img
				src={asset.publicUrl}
				alt={asset.altText || asset.title || asset.fileName}
				className={className ?? 'h-48 w-full rounded-xl object-cover'}
			/>
		)
	}

	if (asset.kind === 'audio') {
		return (
			<div className={className ?? 'flex h-48 w-full items-center justify-center rounded-xl border bg-muted/30 p-4'}>
				<audio controls className="w-full" src={asset.publicUrl}>
					Your browser does not support audio playback.
				</audio>
			</div>
		)
	}

	if (asset.kind === 'video') {
		return (
			<video
				className={className ?? 'h-48 w-full rounded-xl bg-black object-cover'}
				src={asset.publicUrl}
				controls
			/>
		)
	}

	return (
		<div
			className={
				className ??
				'flex h-48 w-full flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 text-center'
			}
		>
			<FileText className="mb-3 h-10 w-10 text-muted-foreground" />
			<p className="px-4 text-sm font-medium">{asset.fileName}</p>
			<a
				href={asset.publicUrl}
				target="_blank"
				rel="noreferrer"
				className="mt-2 text-xs text-muted-foreground underline"
			>
				Open file
			</a>
		</div>
	)
}

export function MediaLibraryManager({
	initialAssets,
	initialFolders,
	initialTags,
}: {
	initialAssets: MediaLibraryAsset[]
	initialFolders: MediaLibraryFolder[]
	initialTags: TagOption[]
}) {
	const router = useRouter()
	const [isPending, startTransition] = useTransition()

	const [search, setSearch] = useState('')
	const [kindFilter, setKindFilter] = useState('all')
	const [folderFilter, setFolderFilter] = useState('all')
	const [tagFilter, setTagFilter] = useState('all')
	const [selectedAsset, setSelectedAsset] = useState<MediaLibraryAsset | null>(
		initialAssets[0] ?? null
	)

	const [uploadItems, setUploadItems] = useState<BatchUploadItem[]>([])
	const [uploadFolderId, setUploadFolderId] = useState('root')
	const [uploadTags, setUploadTags] = useState('')

	const [newFolderName, setNewFolderName] = useState('')
	const [newFolderParentId, setNewFolderParentId] = useState('root')
	const [newTagName, setNewTagName] = useState('')

	const [editTitle, setEditTitle] = useState(selectedAsset?.title ?? '')
	const [editDescription, setEditDescription] = useState(
		selectedAsset?.description ?? ''
	)
	const [editAltText, setEditAltText] = useState(selectedAsset?.altText ?? '')
	const [editFolderId, setEditFolderId] = useState(
		selectedAsset?.folderId ?? 'root'
	)
	const [editTags, setEditTags] = useState(
		selectedAsset?.tags.map((tag) => tag.name).join(', ') ?? ''
	)

	const filteredAssets = useMemo(() => {
		const needle = search.trim().toLowerCase()
		return initialAssets.filter((asset) => {
			if (kindFilter !== 'all' && asset.kind !== kindFilter) return false
			if (folderFilter !== 'all' && asset.folderId !== folderFilter) return false
			if (
				tagFilter !== 'all' &&
				!asset.tags.some((tag) => tag.id === tagFilter || tag.slug === tagFilter)
			) {
				return false
			}
			if (!needle) return true

			const haystack = [
				asset.title,
				asset.fileName,
				asset.description,
				asset.altText,
				asset.folderPathLabel,
				asset.mimeType,
				...asset.tags.map((tag) => tag.name),
			]
				.filter(Boolean)
				.join(' ')
				.toLowerCase()

			return haystack.includes(needle)
		})
	}, [folderFilter, initialAssets, kindFilter, search, tagFilter])

	const folderOptions = initialFolders
	const tagOptions = initialTags

	function refreshPage() {
		startTransition(() => {
			router.refresh()
		})
	}

	function syncEditFields(asset: MediaLibraryAsset) {
		setSelectedAsset(asset)
		setEditTitle(asset.title ?? '')
		setEditDescription(asset.description ?? '')
		setEditAltText(asset.altText ?? '')
		setEditFolderId(asset.folderId ?? 'root')
		setEditTags(asset.tags.map((tag) => tag.name).join(', '))
	}

	function buildBatchUploadItems(files: FileList | null) {
		if (!files || files.length === 0) {
			setUploadItems([])
			return
		}

		const nextItems = Array.from(files).map((file, index) => ({
			id: `${file.name}-${file.size}-${index}`,
			file,
			title: file.name.replace(/\.[^.]+$/, ''),
			description: '',
			altText: '',
			kind: 'auto',
		}))

		setUploadItems(nextItems)
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

		let successCount = 0
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

			const data = await res.json()
			if (!res.ok) {
				toast.error(data?.error || `Upload failed for ${item.file.name}.`)
				return
			}

			successCount += 1
		}

		toast.success(
			successCount === 1
				? '1 media item uploaded.'
				: `${successCount} media items uploaded.`
		)
		setUploadItems([])
		setUploadFolderId('root')
		setUploadTags('')
		refreshPage()
	}

	async function handleCreateFolder(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault()
		const res = await fetch('/api/admin/media/folders', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				name: newFolderName,
				parentId: newFolderParentId === 'root' ? null : newFolderParentId,
			}),
		})
		const data = await res.json()
		if (!res.ok) {
			toast.error(data?.error || 'Could not create folder.')
			return
		}

		toast.success('Folder created.')
		setNewFolderName('')
		setNewFolderParentId('root')
		refreshPage()
	}

	async function handleCreateTag(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault()
		const res = await fetch('/api/admin/media/tags', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: newTagName }),
		})
		const data = await res.json()
		if (!res.ok) {
			toast.error(data?.error || 'Could not create tag.')
			return
		}

		toast.success('Tag created.')
		setNewTagName('')
		refreshPage()
	}

	async function handleSaveAsset() {
		if (!selectedAsset) return
		const res = await fetch(`/api/admin/media/${selectedAsset.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				title: editTitle,
				description: editDescription,
				altText: editAltText,
				folderId: editFolderId === 'root' ? null : editFolderId,
				tags: editTags
					.split(',')
					.map((tag) => tag.trim())
					.filter(Boolean),
			}),
		})
		const data = await res.json()
		if (!res.ok) {
			toast.error(data?.error || 'Could not save media.')
			return
		}

		toast.success('Media updated.')
		refreshPage()
	}

	async function handleDeleteAsset() {
		if (!selectedAsset) return
		const confirmed = window.confirm(
			`Delete "${selectedAsset.title || selectedAsset.fileName}"?`
		)
		if (!confirmed) return

		const res = await fetch(`/api/admin/media/${selectedAsset.id}`, {
			method: 'DELETE',
		})
		const data = await res.json()
		if (!res.ok) {
			toast.error(data?.error || 'Could not delete media.')
			return
		}

		toast.success('Media deleted.')
		setSelectedAsset(null)
		refreshPage()
	}

	async function copyUrl(url: string) {
		await navigator.clipboard.writeText(url)
		toast.success('Public URL copied.')
	}

	const selectedAssetFromCurrentData = selectedAsset
		? initialAssets.find((asset) => asset.id === selectedAsset.id) ?? null
		: null

	return (
		<div className="space-y-6">
			<div className="rounded-3xl border border-border/60 bg-gradient-to-br from-amber-50 via-background to-rose-50 p-6 shadow-sm">
				<div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
					<div>
						<p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">
							Admin Workspace
						</p>
						<h1 className="font-[family:var(--font-eczar)] text-4xl text-balance">
							Media Library
						</h1>
						<p className="mt-2 max-w-3xl text-sm text-muted-foreground">
							Upload once, organize into folders, tag everything clearly, and
							keep reusable media ready for lessons across the site.
						</p>
					</div>
					<div className="flex flex-wrap gap-2">
						<Badge variant="secondary">{initialAssets.length} assets</Badge>
						<Badge variant="secondary">{initialFolders.length} folders</Badge>
						<Badge variant="secondary">{initialTags.length} tags</Badge>
						<Badge>All uploads public</Badge>
					</div>
				</div>
			</div>

			<div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_380px]">
				<div className="space-y-6">
					<Card className="border-border/60">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Plus className="h-4 w-4" />
								Upload Media
							</CardTitle>
						</CardHeader>
						<CardContent>
							<form className="space-y-4" onSubmit={handleUpload}>
								<div className="space-y-2">
									<Label htmlFor="media-file">Files</Label>
									<Input
										id="media-file"
										type="file"
										multiple
										onChange={(event) =>
											buildBatchUploadItems(event.target.files)
										}
									/>
									<p className="text-xs text-muted-foreground">
										Choose several files, then name each one before uploading.
									</p>
								</div>
								<div className="grid gap-4 md:grid-cols-1">
									<div className="space-y-2">
										<Label>Folder</Label>
										<Select
											value={uploadFolderId}
											onValueChange={setUploadFolderId}
										>
											<SelectTrigger>
												<SelectValue placeholder="Root" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="root">Root</SelectItem>
												{folderOptions.map((folder) => (
													<SelectItem key={folder.id} value={folder.id}>
														{folder.pathLabel}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
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
								{uploadItems.length > 0 ? (
									<div className="space-y-3 rounded-2xl border bg-muted/20 p-3">
										<div className="flex items-center justify-between gap-3">
											<div>
												<p className="font-medium">Batch details</p>
												<p className="text-xs text-muted-foreground">
													Review and rename each file before upload.
												</p>
											</div>
											<Badge variant="secondary">
												{uploadItems.length} selected
											</Badge>
										</div>
										<div className="space-y-3">
											{uploadItems.map((item) => (
												<div
													key={item.id}
													className="rounded-xl border bg-background p-3"
												>
													<div className="flex items-start justify-between gap-3">
														<div className="min-w-0">
															<p className="truncate text-sm font-medium">
																{item.file.name}
															</p>
															<p className="text-xs text-muted-foreground">
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
													<div className="mt-3 space-y-3">
														<div className="space-y-2">
															<Label htmlFor={`upload-title-${item.id}`}>
																Title
															</Label>
															<Input
																id={`upload-title-${item.id}`}
																value={item.title}
																onChange={(event) =>
																	updateUploadItem(
																		item.id,
																		'title',
																		event.target.value
																	)
																}
															/>
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
																placeholder="Optional context for this file"
															/>
														</div>
														<div className="space-y-2">
															<Label htmlFor={`upload-alt-${item.id}`}>
																Alt text
															</Label>
															<Input
																id={`upload-alt-${item.id}`}
																value={item.altText}
																onChange={(event) =>
																	updateUploadItem(
																		item.id,
																		'altText',
																		event.target.value
																	)
																}
																placeholder="Useful for images"
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
																	<SelectItem value="auto">
																		Auto-detect
																	</SelectItem>
																	<SelectItem value="image">Image</SelectItem>
																	<SelectItem value="audio">Audio</SelectItem>
																	<SelectItem value="video">Video</SelectItem>
																	<SelectItem value="document">
																		Document
																	</SelectItem>
																	<SelectItem value="other">Other</SelectItem>
																</SelectContent>
															</Select>
														</div>
													</div>
												</div>
											))}
										</div>
									</div>
								) : null}
								<Button className="w-full" disabled={isPending} type="submit">
									{isPending
										? 'Working...'
										: uploadItems.length > 1
											? `Upload ${uploadItems.length} Items`
											: 'Upload to Library'}
								</Button>
							</form>
						</CardContent>
					</Card>

					<Card className="border-border/60">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<FolderPlus className="h-4 w-4" />
								Folders & Tags
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6">
							<form className="space-y-3" onSubmit={handleCreateFolder}>
								<div className="space-y-2">
									<Label htmlFor="folder-name">New folder</Label>
									<Input
										id="folder-name"
										value={newFolderName}
										onChange={(event) => setNewFolderName(event.target.value)}
										placeholder="Lesson covers"
									/>
								</div>
								<div className="space-y-2">
									<Label>Parent folder</Label>
									<Select
										value={newFolderParentId}
										onValueChange={setNewFolderParentId}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="root">Root</SelectItem>
											{folderOptions.map((folder) => (
												<SelectItem key={folder.id} value={folder.id}>
													{folder.pathLabel}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<Button type="submit" variant="outline" className="w-full">
									Create Folder
								</Button>
							</form>

							<form className="space-y-3" onSubmit={handleCreateTag}>
								<div className="space-y-2">
									<Label htmlFor="tag-name">New tag</Label>
									<Input
										id="tag-name"
										value={newTagName}
										onChange={(event) => setNewTagName(event.target.value)}
										placeholder="vocabulary"
									/>
								</div>
								<Button type="submit" variant="outline" className="w-full">
									Create Tag
								</Button>
							</form>
						</CardContent>
					</Card>
				</div>

				<div className="space-y-6">
					<Card className="border-border/60">
						<CardContent className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_170px_180px_180px]">
							<div className="space-y-2">
								<Label htmlFor="media-search">Search</Label>
								<div className="relative">
									<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
									<Input
										id="media-search"
										className="pl-9"
										value={search}
										onChange={(event) => setSearch(event.target.value)}
										placeholder="Search title, file, folder, tags..."
									/>
								</div>
							</div>
							<div className="space-y-2">
								<Label>Type</Label>
								<Select value={kindFilter} onValueChange={setKindFilter}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All types</SelectItem>
										<SelectItem value="image">Images</SelectItem>
										<SelectItem value="audio">Audio</SelectItem>
										<SelectItem value="video">Video</SelectItem>
										<SelectItem value="document">Documents</SelectItem>
										<SelectItem value="other">Other</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label>Folder</Label>
								<Select value={folderFilter} onValueChange={setFolderFilter}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All folders</SelectItem>
										{folderOptions.map((folder) => (
											<SelectItem key={folder.id} value={folder.id}>
												{folder.pathLabel}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label>Tag</Label>
								<Select value={tagFilter} onValueChange={setTagFilter}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All tags</SelectItem>
										{tagOptions.map((tag) => (
											<SelectItem key={tag.id} value={tag.id}>
												{tag.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</CardContent>
					</Card>

					<Card className="border-border/60">
						<CardHeader className="flex flex-row items-center justify-between">
							<CardTitle>Library Contents</CardTitle>
							<p className="text-sm text-muted-foreground">
								Showing {filteredAssets.length} of {initialAssets.length}
							</p>
						</CardHeader>
						<CardContent className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
							{filteredAssets.length === 0 ? (
								<div className="col-span-full rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
									No media matches these filters yet.
								</div>
							) : null}

							{filteredAssets.map((asset) => {
								const Icon = getKindIcon(asset.kind)
								const isActive = selectedAsset?.id === asset.id
								return (
									<button
										key={asset.id}
										type="button"
										onClick={() => syncEditFields(asset)}
										className={`rounded-2xl border p-4 text-left transition ${
											isActive
												? 'border-amber-500 bg-amber-50 shadow-sm'
												: 'border-border/60 bg-card hover:border-amber-300 hover:bg-accent/30'
										}`}
									>
										<AssetPreview asset={asset} className="h-40 w-full rounded-xl object-cover" />
										<div className="mt-4 flex items-start justify-between gap-3">
											<div className="min-w-0">
												<p className="truncate font-medium">
													{asset.title || asset.fileName}
												</p>
												<p className="truncate text-xs text-muted-foreground">
													{asset.fileName}
												</p>
											</div>
											<Badge variant="secondary" className="shrink-0">
												<Icon className="mr-1 h-3 w-3" />
												{asset.kind}
											</Badge>
										</div>
										<div className="mt-3 flex flex-wrap gap-2">
											{asset.folderPathLabel ? (
												<Badge variant="outline">{asset.folderPathLabel}</Badge>
											) : (
												<Badge variant="outline">Root</Badge>
											)}
											{asset.tags.slice(0, 3).map((tag) => (
												<Badge key={tag.id} variant="outline">
													{tag.name}
												</Badge>
											))}
											{asset.tags.length > 3 ? (
												<Badge variant="outline">+{asset.tags.length - 3}</Badge>
											) : null}
										</div>
										<div className="mt-3 text-xs text-muted-foreground">
											{formatBytes(asset.sizeBytes)} • {formatDate(asset.createdAt)}
										</div>
									</button>
								)
							})}
						</CardContent>
					</Card>
				</div>

				<div className="space-y-6">
					<Card className="border-border/60">
						<CardHeader className="flex flex-row items-start justify-between gap-3">
							<div>
								<CardTitle>Asset Details</CardTitle>
								<p className="mt-1 text-sm text-muted-foreground">
									{selectedAssetFromCurrentData
										? 'Preview and edit the selected asset.'
										: 'Select an asset to review metadata and copy its URL.'}
								</p>
							</div>
							{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
						</CardHeader>
						<CardContent className="space-y-5">
							{selectedAssetFromCurrentData ? (
								<>
									<AssetPreview asset={selectedAssetFromCurrentData} />

									<div className="flex flex-wrap gap-2">
										<Button
											variant="outline"
											onClick={() =>
												copyUrl(selectedAssetFromCurrentData.publicUrl)
											}
										>
											<Copy className="mr-2 h-4 w-4" />
											Copy URL
										</Button>
										<Dialog>
											<DialogTrigger asChild>
												<Button variant="outline">Preview</Button>
											</DialogTrigger>
											<DialogContent className="max-w-4xl">
												<DialogHeader>
													<DialogTitle>
														{selectedAssetFromCurrentData.title ||
															selectedAssetFromCurrentData.fileName}
													</DialogTitle>
													<DialogDescription>
														{selectedAssetFromCurrentData.publicUrl}
													</DialogDescription>
												</DialogHeader>
												<AssetPreview
													asset={selectedAssetFromCurrentData}
													className="max-h-[70vh] w-full rounded-xl object-contain"
												/>
											</DialogContent>
										</Dialog>
										<Button
											variant="destructive"
											onClick={handleDeleteAsset}
										>
											<Trash2 className="mr-2 h-4 w-4" />
											Delete
										</Button>
									</div>

									<div className="grid gap-3 rounded-2xl border bg-muted/20 p-4 text-sm">
										<div>
											<p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
												Public URL
											</p>
											<p className="break-all font-mono text-xs">
												{selectedAssetFromCurrentData.publicUrl}
											</p>
										</div>
										<div className="grid gap-3 sm:grid-cols-2">
											<div>
												<p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
													Bucket
												</p>
												<p>{selectedAssetFromCurrentData.bucket}</p>
											</div>
											<div>
												<p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
													Stored path
												</p>
												<p className="break-all">
													{selectedAssetFromCurrentData.objectPath}
												</p>
											</div>
											<div>
												<p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
													Mime type
												</p>
												<p>{selectedAssetFromCurrentData.mimeType || 'Unknown'}</p>
											</div>
											<div>
												<p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
													Uploaded
												</p>
												<p>{formatDate(selectedAssetFromCurrentData.createdAt)}</p>
											</div>
										</div>
									</div>

									<div className="space-y-4">
										<div className="space-y-2">
											<Label htmlFor="edit-title">Title</Label>
											<Input
												id="edit-title"
												value={editTitle}
												onChange={(event) => setEditTitle(event.target.value)}
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="edit-description">Description</Label>
											<Textarea
												id="edit-description"
												value={editDescription}
												onChange={(event) =>
													setEditDescription(event.target.value)
												}
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="edit-alt-text">Alt text</Label>
											<Input
												id="edit-alt-text"
												value={editAltText}
												onChange={(event) => setEditAltText(event.target.value)}
											/>
										</div>
										<div className="space-y-2">
											<Label>Folder</Label>
											<Select value={editFolderId} onValueChange={setEditFolderId}>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="root">Root</SelectItem>
													{folderOptions.map((folder) => (
														<SelectItem key={folder.id} value={folder.id}>
															{folder.pathLabel}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<div className="space-y-2">
											<Label htmlFor="edit-tags">Tags</Label>
											<Input
												id="edit-tags"
												value={editTags}
												onChange={(event) => setEditTags(event.target.value)}
												placeholder="comma, separated, tags"
											/>
										</div>
										<Button onClick={handleSaveAsset}>Save Metadata</Button>
									</div>
								</>
							) : (
								<div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
									Choose an asset from the library to preview and edit it here.
								</div>
							)}
						</CardContent>
					</Card>

					<Card className="border-border/60">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<FolderClosed className="h-4 w-4" />
								Folder Map
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							<button
								type="button"
								onClick={() => setFolderFilter('all')}
								className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm ${
									folderFilter === 'all' ? 'bg-accent' : 'hover:bg-accent/50'
								}`}
							>
								<span>All folders</span>
								<Badge variant="outline">{initialAssets.length}</Badge>
							</button>
							{folderOptions.map((folder) => (
								<button
									key={folder.id}
									type="button"
									onClick={() => setFolderFilter(folder.id)}
									className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm ${
										folderFilter === folder.id ? 'bg-accent' : 'hover:bg-accent/50'
									}`}
									style={{ paddingLeft: `${0.75 + folder.depth * 0.9}rem` }}
								>
									<span className="truncate">{folder.pathLabel}</span>
									<Badge variant="outline">{folder.assetCount}</Badge>
								</button>
							))}
						</CardContent>
					</Card>

					<Card className="border-border/60">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Tag className="h-4 w-4" />
								Tag Shelf
							</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-wrap gap-2">
							<button
								type="button"
								onClick={() => setTagFilter('all')}
								className={`rounded-full border px-3 py-1 text-sm ${
									tagFilter === 'all' ? 'bg-accent' : 'hover:bg-accent/50'
								}`}
							>
								All tags
							</button>
							{tagOptions.map((tag) => (
								<button
									key={tag.id}
									type="button"
									onClick={() => setTagFilter(tag.id)}
									className={`rounded-full border px-3 py-1 text-sm ${
										tagFilter === tag.id ? 'bg-accent' : 'hover:bg-accent/50'
									}`}
								>
									{tag.name}
								</button>
							))}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	)
}
