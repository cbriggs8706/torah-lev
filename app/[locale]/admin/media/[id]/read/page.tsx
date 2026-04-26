import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { notFound, redirect } from 'next/navigation'
import { LearningPageActions } from '@/components/admin/learning/LearningPageActions'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { authOptions } from '@/lib/auth'
import { getMediaAssetById } from '@/lib/media/library'
import {
	formatBytes,
	formatDate,
	MediaAssetPreview,
	MediaKindBadge,
} from '@/components/admin/media/mediaShared'
import { MediaAdminHeader } from '@/components/admin/media/MediaAdminHeader'

export default async function ReadMediaPage({
	params,
}: {
	params: Promise<{ locale: string; id: string }>
}) {
	const { locale, id } = await params
	const session = await getServerSession(authOptions)
	const role = session?.user?.role ?? 'guest'

	if (!session || !['admin', 'teacher'].includes(role)) {
		redirect(`/${locale}/login`)
	}

	const asset = await getMediaAssetById(id)
	if (!asset) notFound()

	return (
		<div className="space-y-6">
			<MediaAdminHeader
				title="Read Asset"
				description="Review a single file with its metadata on a dedicated page so updates and destructive actions stay deliberate."
			/>

			<Card>
				<CardContent className="grid gap-6 p-6 lg:grid-cols-[360px_minmax(0,1fr)]">
					<div className="space-y-4">
						<MediaAssetPreview asset={asset} />
						<div className="flex flex-wrap gap-2">
							<Button asChild variant="outline">
								<Link href={asset.publicUrl} target="_blank" rel="noreferrer">
									Preview Original
								</Link>
							</Button>
							<Button asChild variant="outline">
								<Link href={`/${locale}/admin/media/${asset.id}/update`}>
									Update Metadata
								</Link>
							</Button>
						</div>
					</div>
					<div className="space-y-5">
						<div className="flex flex-wrap items-start justify-between gap-3">
							<div>
								<h2 className="text-2xl font-semibold">
									{asset.title || asset.fileName}
								</h2>
								<p className="mt-1 text-base text-muted-foreground">
									{asset.fileName}
								</p>
							</div>
							<MediaKindBadge kind={asset.kind} />
						</div>

						<div className="grid gap-4 rounded-2xl border bg-muted/20 p-4 sm:grid-cols-2">
							<div>
								<p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
									Folder
								</p>
								<p>{asset.folderPathLabel || 'Root'}</p>
							</div>
							<div>
								<p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
									Uploaded
								</p>
								<p>{formatDate(asset.createdAt)}</p>
							</div>
							<div>
								<p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
									Mime Type
								</p>
								<p>{asset.mimeType || 'Unknown'}</p>
							</div>
							<div>
								<p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
									Size
								</p>
								<p>{formatBytes(asset.sizeBytes)}</p>
							</div>
						</div>

						<div className="space-y-4">
							<div>
								<p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
									Public URL
								</p>
								<p className="break-all text-base">{asset.publicUrl}</p>
							</div>
							<div>
								<p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
									Description
								</p>
								<p className="text-base text-muted-foreground">
									{asset.description || 'No description'}
								</p>
							</div>
							<div>
								<p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
									Alt Text
								</p>
								<p className="text-base text-muted-foreground">
									{asset.altText || 'No alt text'}
								</p>
							</div>
							<div>
								<p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
									Tags
								</p>
								<p className="text-base text-muted-foreground">
									{asset.tags.length > 0
										? asset.tags.map((tag) => tag.name).join(', ')
										: 'No tags'}
								</p>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			<LearningPageActions
				backHref={`/${locale}/admin/media`}
				backLabel="Back to assets"
				updateHref={`/${locale}/admin/media/${id}/update`}
				deleteHref={`/${locale}/admin/media/${id}/delete`}
				deleteLabel={asset.title || asset.fileName}
			/>
		</div>
	)
}
