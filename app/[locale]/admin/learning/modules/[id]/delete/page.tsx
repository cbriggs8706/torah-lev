import { DeleteResourcePanel } from '@/components/admin/learning/DeleteResourcePanel'

export default async function DeleteModulePage({
	params,
}: {
	params: Promise<{ locale: string; id: string }>
}) {
	const { locale, id } = await params
	return (
		<DeleteResourcePanel
			apiPath={`/api/admin/learning/modules/${id}`}
			backHref={`/${locale}/admin/learning/modules`}
			resourceLabel="module"
			resourceTitle={id}
		/>
	)
}
