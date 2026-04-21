import { ResourceRouteShell } from '@/components/admin/learning/ResourceRouteShell'

export default async function ReadOrganizationPage({
	params,
}: {
	params: Promise<{ locale: string; id: string }>
}) {
	const { locale, id } = await params
	return (
		<ResourceRouteShell
			title="Read Organization"
			description="Organization details will be displayed here."
			backHref={`/${locale}/admin/learning/organizations`}
			updateHref={`/${locale}/admin/learning/organizations/${id}/update`}
			deleteHref={`/${locale}/admin/learning/organizations/${id}/delete`}
			deleteLabel="organization"
		/>
	)
}
