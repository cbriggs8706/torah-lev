'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import type { MediaLibraryFolder } from '@/lib/media/library'

type MediaTag = {
	id: string
	name: string
	slug: string
}

export function MediaFoldersManager({
	folders,
}: {
	folders: MediaLibraryFolder[]
}) {
	const router = useRouter()
	const [saving, setSaving] = useState(false)
	const [name, setName] = useState('')
	const [parentId, setParentId] = useState('root')

	async function createFolder(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setSaving(true)

		try {
			const res = await fetch('/api/admin/media/folders', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name,
					parentId: parentId === 'root' ? null : parentId,
				}),
			})

			if (!res.ok) {
				const body = await res.json().catch(() => null)
				throw new Error(body?.error || 'Could not create folder.')
			}

			toast.success('Folder created.')
			setName('')
			setParentId('root')
			router.refresh()
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Could not create folder.')
		} finally {
			setSaving(false)
		}
	}

	return (
		<div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
			<Card>
				<CardHeader>
					<CardTitle>Create Folder</CardTitle>
				</CardHeader>
				<CardContent>
					<form className="space-y-4" onSubmit={createFolder}>
						<div className="space-y-2">
							<Label htmlFor="folder-name">Name</Label>
							<Input
								id="folder-name"
								value={name}
								onChange={(event) => setName(event.target.value)}
								placeholder="Lesson covers"
							/>
						</div>
						<div className="space-y-2">
							<Label>Parent folder</Label>
							<Select value={parentId} onValueChange={setParentId}>
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
						<Button type="submit" disabled={saving}>
							{saving ? 'Creating...' : 'Create Folder'}
						</Button>
					</form>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Folder List</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2">
					<div className="rounded-2xl border px-4 py-3 text-base">
						<div className="flex items-center justify-between gap-3">
							<span className="font-medium">Root</span>
						</div>
					</div>
					{folders.map((folder) => (
						<div
							key={folder.id}
							className="rounded-2xl border px-4 py-3 text-base"
							style={{ paddingLeft: `${1 + folder.depth * 1.15}rem` }}
						>
							<div className="flex items-center justify-between gap-3">
								<div>
									<p className="font-medium">{folder.name}</p>
									<p className="text-sm text-muted-foreground">
										{folder.pathLabel}
									</p>
								</div>
								<p className="text-sm text-muted-foreground">
									{folder.assetCount} assets
								</p>
							</div>
						</div>
					))}
				</CardContent>
			</Card>
		</div>
	)
}

export function MediaTagsManager({ tags }: { tags: MediaTag[] }) {
	const router = useRouter()
	const [saving, setSaving] = useState(false)
	const [name, setName] = useState('')

	async function createTag(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setSaving(true)

		try {
			const res = await fetch('/api/admin/media/tags', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name }),
			})

			if (!res.ok) {
				const body = await res.json().catch(() => null)
				throw new Error(body?.error || 'Could not create tag.')
			}

			toast.success('Tag created.')
			setName('')
			router.refresh()
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Could not create tag.')
		} finally {
			setSaving(false)
		}
	}

	return (
		<div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
			<Card>
				<CardHeader>
					<CardTitle>Create Tag</CardTitle>
				</CardHeader>
				<CardContent>
					<form className="space-y-4" onSubmit={createTag}>
						<div className="space-y-2">
							<Label htmlFor="tag-name">Name</Label>
							<Input
								id="tag-name"
								value={name}
								onChange={(event) => setName(event.target.value)}
								placeholder="vocabulary"
							/>
						</div>
						<Button type="submit" disabled={saving}>
							{saving ? 'Creating...' : 'Create Tag'}
						</Button>
					</form>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Tag List</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
					{tags.map((tag) => (
						<div key={tag.id} className="rounded-2xl border px-4 py-3">
							<p className="font-medium">{tag.name}</p>
							<p className="text-sm text-muted-foreground">{tag.slug}</p>
						</div>
					))}
				</CardContent>
			</Card>
		</div>
	)
}
