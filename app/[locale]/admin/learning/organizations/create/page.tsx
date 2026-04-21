import { ResourceRouteShell } from '@/components/admin/learning/ResourceRouteShell'

export default async function CreateOrganizationPage({
	params,
}: {
	params: Promise<{ locale: string }>
}) {
	const { locale } = await params
	return (
		<ResourceRouteShell
			title="Create Organization"
			description="Organization creation will move into a focused form here."
			backHref={`/${locale}/admin/learning/organizations`}
		/>
	)
}
