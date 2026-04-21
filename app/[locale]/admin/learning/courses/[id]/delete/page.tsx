import { DeleteResourcePanel } from '@/components/admin/learning/DeleteResourcePanel'

export default async function DeleteCoursePage({
	params,
}: {
	params: Promise<{ locale: string; id: string }>
}) {
	const { locale, id } = await params
	return (
		<DeleteResourcePanel
			apiPath={`/api/admin/learning/courses/${id}`}
			backHref={`/${locale}/admin/learning/courses`}
			resourceLabel="course"
			resourceTitle={id}
		/>
	)
}
