import { ResourceRouteShell } from '@/components/admin/learning/ResourceRouteShell'

export default async function ReadTargetLanguagePage({
	params,
}: {
	params: Promise<{ locale: string; id: string }>
}) {
	const { locale, id } = await params
	return (
		<ResourceRouteShell
			title="Read Target Language"
			description="Target language details will be displayed here."
			backHref={`/${locale}/admin/learning/target-languages`}
			updateHref={`/${locale}/admin/learning/target-languages/${id}/update`}
			deleteHref={`/${locale}/admin/learning/target-languages/${id}/delete`}
			deleteLabel="target language"
		/>
	)
}
