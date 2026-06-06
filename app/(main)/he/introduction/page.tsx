import { redirect } from 'next/navigation'

export default async function IntroductionRedirectPage({
	searchParams,
}: {
	searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
	const resolvedSearchParams = (await searchParams) ?? {}
	const query = new URLSearchParams()

	for (const [key, value] of Object.entries(resolvedSearchParams)) {
		if (Array.isArray(value)) {
			for (const item of value) {
				query.append(key, item)
			}
		} else if (typeof value === 'string') {
			query.set(key, value)
		}
	}

	const suffix = query.toString()
	redirect(suffix ? `/he/vocabulary?${suffix}` : '/he/vocabulary')
}
