import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { getMediaLibraryData } from '@/lib/media/library'
import { MediaAdminHeader } from '@/components/admin/media/MediaAdminHeader'
import { MediaTagsManager } from '@/components/admin/media/MediaTaxonomyManager'

interface PageProps {
	params: Promise<{ locale: string }>
}

export default async function MediaTagsPage({ params }: PageProps) {
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
				title="Manage Tags"
				description="Keep tagging intentional and reusable so filtering stays useful even as the asset library grows."
			/>
			<MediaTagsManager tags={data.tags} />
		</div>
	)
}
