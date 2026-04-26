import { getServerSession } from 'next-auth'
import { notFound, redirect } from 'next/navigation'
import { DeleteResourcePanel } from '@/components/admin/learning/DeleteResourcePanel'
import { authOptions } from '@/lib/auth'
import { getMediaAssetById } from '@/lib/media/library'

export default async function DeleteMediaPage({
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
		<DeleteResourcePanel
			apiPath={`/api/admin/media/${id}`}
			backHref={`/${locale}/admin/media`}
			resourceLabel="asset"
			resourceTitle={asset.title || asset.fileName}
		/>
	)
}
