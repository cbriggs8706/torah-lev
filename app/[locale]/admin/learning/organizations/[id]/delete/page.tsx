import { DeleteResourcePanel } from '@/components/admin/learning/DeleteResourcePanel'

export default async function DeleteOrganizationPage({
	params,
}: {
	params: Promise<{ locale: string; id: string }>
}) {
	const { locale, id } = await params
	return (
		<DeleteResourcePanel
			apiPath={`/api/admin/learning/organizations/${id}`}
			backHref={`/${locale}/admin/learning/organizations`}
			resourceLabel="organization"
			resourceTitle={id}
		/>
	)
}
