import Image from 'next/image'
import { FileText } from 'lucide-react'

export type QuizMediaAssetValue = {
	kind: string
	bucket: string
	objectPath: string
	fileName: string
	title: string | null
	altText: string | null
	width?: number | null
	height?: number | null
}

function getMediaUrl(asset: QuizMediaAssetValue) {
	const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
	if (!baseUrl) return null

	return `${baseUrl}/storage/v1/object/public/${asset.bucket}/${asset.objectPath}`
}

export function QuizMediaAsset({
	asset,
	className,
}: {
	asset: QuizMediaAssetValue
	className?: string
}) {
	const url = getMediaUrl(asset)
	const label = asset.title || asset.fileName

	if (!url) {
		return (
			<p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
				Media preview unavailable.
			</p>
		)
	}

	if (asset.kind === 'image') {
		return (
			<Image
				src={url}
				alt={asset.altText || label}
				width={asset.width ?? 1200}
				height={asset.height ?? 675}
				sizes="(min-width: 768px) 50vw, 100vw"
				unoptimized
				className={
					className ??
					'max-h-80 w-full rounded-xl border border-border bg-muted/30 object-contain'
				}
			/>
		)
	}

	if (asset.kind === 'audio') {
		return (
			<div
				className={
					className ??
					'rounded-xl border border-border bg-muted/30 p-4'
				}
			>
				<audio controls className="w-full" src={url}>
					Your browser does not support audio playback.
				</audio>
			</div>
		)
	}

	if (asset.kind === 'video') {
		return (
			<video
				className={
					className ??
					'aspect-video w-full rounded-xl border border-border bg-black object-contain'
				}
				src={url}
				controls
			/>
		)
	}

	return (
		<div
			className={
				className ??
				'flex min-h-32 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 p-4 text-center'
			}
		>
			<FileText className="mb-3 h-8 w-8 text-muted-foreground" />
			<p className="text-sm font-medium">{asset.fileName}</p>
			<a
				href={url}
				target="_blank"
				rel="noreferrer"
				className="mt-2 text-xs text-muted-foreground underline"
			>
				Open file
			</a>
		</div>
	)
}
