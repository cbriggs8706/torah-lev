import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { getMediaLibraryData } from '@/lib/media/library'
import { MediaLibraryManager } from '@/components/admin/media/MediaLibraryManager'

interface PageProps {
	params: Promise<{ locale: string }>
}

export default async function AdminMediaPage({ params }: PageProps) {
	const { locale } = await params
	const session = await getServerSession(authOptions)
	const role = session?.user?.role ?? 'guest'

	if (!session || !['admin', 'teacher'].includes(role)) {
		redirect(`/${locale}/login`)
	}

	const data = await getMediaLibraryData()

	return (
		<MediaLibraryManager
			initialAssets={data.assets}
			initialFolders={data.folders}
			initialTags={data.tags}
		/>
	)
}
