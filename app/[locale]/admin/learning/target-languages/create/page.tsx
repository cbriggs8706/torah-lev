import { ResourceRouteShell } from '@/components/admin/learning/ResourceRouteShell'

export default async function CreateTargetLanguagePage({
	params,
}: {
	params: Promise<{ locale: string }>
}) {
	const { locale } = await params
	return (
		<ResourceRouteShell
			title="Create Target Language"
			description="Target language creation will move into a focused form here."
			backHref={`/${locale}/admin/learning/target-languages`}
		/>
	)
}
