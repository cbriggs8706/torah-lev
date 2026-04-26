import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { getMediaLibraryData } from '@/lib/media/library'
import { MediaAdminHeader } from '@/components/admin/media/MediaAdminHeader'
import { MediaFoldersManager } from '@/components/admin/media/MediaTaxonomyManager'

interface PageProps {
	params: Promise<{ locale: string }>
}

export default async function MediaFoldersPage({ params }: PageProps) {
	const { locale } = await params
	const session = await getServerSession(authOptions)
	const role = session?.user?.role ?? 'guest'

	if (!session || !['admin', 'teacher'].includes(role)) {
		redirect(`/${locale}/login`)
	}

	const data = await getMediaLibraryData()

	return (
		<div className="space-y-6">
			<MediaAdminHeader
				title="Manage Folders"
				description="Keep large libraries organized with a dedicated page for folder structure instead of burying taxonomy controls inside the asset browser."
			/>
			<MediaFoldersManager folders={data.folders} />
		</div>
	)
}
