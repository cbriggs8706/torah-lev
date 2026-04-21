import { DeleteResourcePanel } from '@/components/admin/learning/DeleteResourcePanel'

export default async function DeleteStudyGroupPage({
	params,
}: {
	params: Promise<{ locale: string; id: string }>
}) {
	const { locale, id } = await params
	return (
		<DeleteResourcePanel
			apiPath={`/api/admin/learning/study-groups/${id}`}
			backHref={`/${locale}/admin/learning/study-groups`}
			resourceLabel="study group"
			resourceTitle={id}
		/>
	)
}
