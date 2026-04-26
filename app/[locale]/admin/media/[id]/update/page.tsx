import { getServerSession } from 'next-auth'
import { notFound, redirect } from 'next/navigation'
import { MediaAdminHeader } from '@/components/admin/media/MediaAdminHeader'
import { MediaAssetEditorForm } from '@/components/admin/media/MediaAssetEditorForm'
import { authOptions } from '@/lib/auth'
import { getMediaAssetById, getMediaLibraryData } from '@/lib/media/library'

export default async function UpdateMediaPage({
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

	const [asset, data] = await Promise.all([
		getMediaAssetById(id),
		getMediaLibraryData(),
	])
	if (!asset) notFound()

	return (
		<div className="space-y-6">
			<MediaAdminHeader
				title="Update Asset"
				description="Edit metadata on a focused page so changes stay clear and the main library remains fast to browse."
			/>
			<MediaAssetEditorForm locale={locale} asset={asset} folders={data.folders} />
		</div>
	)
}
