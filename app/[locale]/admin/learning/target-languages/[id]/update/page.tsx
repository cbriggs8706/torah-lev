import { ResourceRouteShell } from '@/components/admin/learning/ResourceRouteShell'

export default async function UpdateTargetLanguagePage({
	params,
}: {
	params: Promise<{ locale: string }>
}) {
	const { locale } = await params
	return (
		<ResourceRouteShell
			title="Update Target Language"
			description="Target language editing will move into a focused form here."
			backHref={`/${locale}/admin/learning/target-languages`}
		/>
	)
}
