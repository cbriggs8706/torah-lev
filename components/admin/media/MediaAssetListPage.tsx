'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Search, Trash2 } from 'lucide-react'
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import type {
	MediaLibraryAsset,
	MediaLibraryFolder,
} from '@/lib/media/library'
import { MediaAdminHeader } from './MediaAdminHeader'
import {
	formatDate,
	MediaKindBadge,
} from './mediaShared'

type TagOption = {
	id: string
	name: string
	slug: string
}

export function MediaAssetListPage({
	locale,
	assets,
	folders,
	tags,
}: {
	locale: string
	assets: MediaLibraryAsset[]
	folders: MediaLibraryFolder[]
	tags: TagOption[]
}) {
	const [search, setSearch] = useState('')
	const [kindFilter, setKindFilter] = useState('all')
	const [folderFilter, setFolderFilter] = useState('all')
	const [tagFilter, setTagFilter] = useState('all')

	const filteredAssets = useMemo(() => {
		const needle = search.trim().toLowerCase()

		return assets.filter((asset) => {
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
	}, [assets, folderFilter, kindFilter, search, tagFilter])

	return (
		<div className="space-y-6">
			<MediaAdminHeader
				title="All Assets"
				description="Browse the full library, filter large collections quickly, and open dedicated pages for reviewing, updating, or deleting a single asset."
				actions={[
					{ href: `/${locale}/admin/media/create`, label: 'Upload Media', variant: 'default' },
					{ href: `/${locale}/admin/media/folders`, label: 'Manage Folders' },
					{ href: `/${locale}/admin/media/tags`, label: 'Manage Tags' },
				]}
			/>

			<Card>
				<CardContent className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_180px_180px_180px]">
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
								{folders.map((folder) => (
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
								{tags.map((tag) => (
									<SelectItem key={tag.id} value={tag.id}>
										{tag.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle>Assets</CardTitle>
					<p className="text-base text-muted-foreground">
						Showing {filteredAssets.length} of {assets.length}
					</p>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Asset</TableHead>
								<TableHead>Type</TableHead>
								<TableHead>Folder</TableHead>
								<TableHead>Tags</TableHead>
								<TableHead>Uploaded</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredAssets.map((asset) => (
								<TableRow key={asset.id}>
									<TableCell>
										<Link
											href={`/${locale}/admin/media/${asset.id}/read`}
											className="block py-1"
										>
											<p className="font-medium">
												{asset.title || asset.fileName}
											</p>
											<p className="text-sm text-muted-foreground">
												{asset.fileName}
											</p>
										</Link>
									</TableCell>
									<TableCell>
										<MediaKindBadge kind={asset.kind} />
									</TableCell>
									<TableCell>{asset.folderPathLabel || 'Root'}</TableCell>
									<TableCell>
										<p className="max-w-[240px] truncate text-base text-muted-foreground">
											{asset.tags.length > 0
												? asset.tags.map((tag) => tag.name).join(', ')
												: 'No tags'}
										</p>
									</TableCell>
									<TableCell className="text-base text-muted-foreground">
										{formatDate(asset.createdAt)}
									</TableCell>
									<TableCell>
										<div className="flex justify-end gap-2">
											<Button asChild size="sm" variant="outline">
												<Link href={`/${locale}/admin/media/${asset.id}/read`}>
													Read
												</Link>
											</Button>
											<Button asChild size="sm" variant="outline">
												<Link href={`/${locale}/admin/media/${asset.id}/update`}>
													Update
												</Link>
											</Button>
											<Button
												asChild
												size="icon"
												variant="destructive"
												className="h-8 w-8"
											>
												<Link
													href={`/${locale}/admin/media/${asset.id}/delete`}
													aria-label={`Delete ${asset.title || asset.fileName}`}
													title={`Delete ${asset.title || asset.fileName}`}
												>
													<Trash2 className="h-4 w-4" />
													<span className="sr-only">Delete</span>
												</Link>
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))}
							{filteredAssets.length === 0 ? (
								<TableRow>
									<TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
										No media matches these filters yet.
									</TableCell>
								</TableRow>
							) : null}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	)
}
