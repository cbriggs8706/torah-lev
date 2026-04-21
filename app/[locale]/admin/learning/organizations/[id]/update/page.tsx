import { ResourceRouteShell } from '@/components/admin/learning/ResourceRouteShell'

export default async function UpdateOrganizationPage({
	params,
}: {
	params: Promise<{ locale: string }>
}) {
	const { locale } = await params
	return (
		<ResourceRouteShell
			title="Update Organization"
			description="Organization editing will move into a focused form here."
			backHref={`/${locale}/admin/learning/organizations`}
		/>
	)
}
