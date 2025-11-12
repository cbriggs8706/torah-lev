import CreateCourse from '@/components/admin/course-create'
import { getTranslations } from 'next-intl/server'

export default async function Page({
	params,
}: {
	params: Promise<{ locale: string }>
}) {
	const { locale } = await params
	const t = await getTranslations({ locale, namespace: 'courses' })

	return (
		<div className="p-6 space-y-2">
			{/* ✅ Strings only */}
			<h1 className="text-2xl font-bold mb-4">
				{t('create')}
				{t('singular')}
			</h1>

			<CreateCourse />
		</div>
	)
}
