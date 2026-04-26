import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { getMediaLibraryData } from '@/lib/media/library'
import { MediaAdminHeader } from '@/components/admin/media/MediaAdminHeader'
import { MediaUploadForm } from '@/components/admin/media/MediaUploadForm'

interface PageProps {
	params: Promise<{ locale: string }>
}

export default async function CreateMediaPage({ params }: PageProps) {
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
				title="Upload Media"
				description="Add new files in a dedicated workspace so uploads stay focused and metadata is easier to review before anything lands in the library."
			/>
			<MediaUploadForm locale={locale} folders={data.folders} />
		</div>
	)
}
