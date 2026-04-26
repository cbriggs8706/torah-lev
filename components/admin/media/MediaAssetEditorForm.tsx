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
import type {
	MediaLibraryAsset,
	MediaLibraryFolder,
} from '@/lib/media/library'
import { MediaAssetPreview, MediaKindBadge } from './mediaShared'

export function MediaAssetEditorForm({
	locale,
	asset,
	folders,
}: {
	locale: string
	asset: MediaLibraryAsset
	folders: MediaLibraryFolder[]
}) {
	const router = useRouter()
	const [saving, setSaving] = useState(false)
	const [title, setTitle] = useState(asset.title ?? '')
	const [description, setDescription] = useState(asset.description ?? '')
	const [altText, setAltText] = useState(asset.altText ?? '')
	const [folderId, setFolderId] = useState(asset.folderId ?? 'root')
	const [tags, setTags] = useState(asset.tags.map((tag) => tag.name).join(', '))

	async function save() {
		setSaving(true)

		try {
			const res = await fetch(`/api/admin/media/${asset.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title,
					description,
					altText,
					folderId: folderId === 'root' ? null : folderId,
					tags: tags
						.split(',')
						.map((tag) => tag.trim())
						.filter(Boolean),
				}),
			})

			if (!res.ok) {
				const body = await res.json().catch(() => null)
				throw new Error(body?.error || 'Could not save media')
			}

			toast.success('Media updated.')
			router.push(`/${locale}/admin/media/${asset.id}/read`)
			router.refresh()
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Could not save media')
		} finally {
			setSaving(false)
		}
	}

	return (
		<Card>
			<CardContent className="grid gap-6 p-6 lg:grid-cols-[360px_minmax(0,1fr)]">
				<div className="space-y-4">
					<MediaAssetPreview asset={asset} />
					<div className="space-y-2 rounded-2xl border bg-muted/20 p-4 text-base">
						<div className="flex items-center justify-between gap-3">
							<p className="font-medium">{asset.title || asset.fileName}</p>
							<MediaKindBadge kind={asset.kind} />
						</div>
						<p className="break-all text-muted-foreground">{asset.publicUrl}</p>
					</div>
				</div>
				<div className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="edit-title">Title</Label>
						<Input
							id="edit-title"
							value={title}
							onChange={(event) => setTitle(event.target.value)}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="edit-description">Description</Label>
						<Textarea
							id="edit-description"
							value={description}
							onChange={(event) => setDescription(event.target.value)}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="edit-alt-text">Alt text</Label>
						<Input
							id="edit-alt-text"
							value={altText}
							onChange={(event) => setAltText(event.target.value)}
						/>
					</div>
					<div className="space-y-2">
						<Label>Folder</Label>
						<Select value={folderId} onValueChange={setFolderId}>
							<SelectTrigger>
								<SelectValue />
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
						<Label htmlFor="edit-tags">Tags</Label>
						<Input
							id="edit-tags"
							value={tags}
							onChange={(event) => setTags(event.target.value)}
							placeholder="comma, separated, tags"
						/>
					</div>
					<div className="flex gap-3 pt-2">
						<Button type="button" onClick={save} disabled={saving}>
							{saving ? 'Saving...' : 'Save Metadata'}
						</Button>
						<Button
							type="button"
							variant="outline"
							onClick={() => router.push(`/${locale}/admin/media/${asset.id}/read`)}
						>
							Cancel
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
