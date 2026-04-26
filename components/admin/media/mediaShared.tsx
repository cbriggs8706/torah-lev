import { AudioLines, FileText, ImageIcon, Video } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { MediaLibraryAsset } from '@/lib/media/library'

export function formatBytes(size: number | null) {
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

export function formatDate(value: Date | string | null) {
	if (!value) return ''
	return new Date(value).toLocaleString()
}

export function getKindIcon(kind: string) {
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

export function MediaKindBadge({ kind }: { kind: string }) {
	return (
		<Badge variant="secondary" className="shrink-0 capitalize">
			{kind === 'image' ? <ImageIcon className="mr-1 h-3 w-3" /> : null}
			{kind === 'audio' ? <AudioLines className="mr-1 h-3 w-3" /> : null}
			{kind === 'video' ? <Video className="mr-1 h-3 w-3" /> : null}
			{!['image', 'audio', 'video'].includes(kind) ? (
				<FileText className="mr-1 h-3 w-3" />
			) : null}
			{kind}
		</Badge>
	)
}

export function MediaAssetPreview({
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
			<p className="px-4 text-base font-medium">{asset.fileName}</p>
			<a
				href={asset.publicUrl}
				target="_blank"
				rel="noreferrer"
				className="mt-2 text-sm text-muted-foreground underline"
			>
				Open file
			</a>
		</div>
	)
}
