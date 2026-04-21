import { DeleteResourcePanel } from '@/components/admin/learning/DeleteResourcePanel'

export default async function DeleteTargetLanguagePage({
	params,
}: {
	params: Promise<{ locale: string; id: string }>
}) {
	const { locale, id } = await params
	return (
		<DeleteResourcePanel
			apiPath={`/api/admin/learning/target-languages/${id}`}
			backHref={`/${locale}/admin/learning/target-languages`}
			resourceLabel="target language"
			resourceTitle={id}
		/>
	)
}
