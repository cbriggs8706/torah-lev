const ABSOLUTE_URL_PATTERN = /^https?:\/\//i

function trimLeadingSlash(value: string) {
	return value.replace(/^\/+/, '')
}

export function normalizeVocabStoragePath(value?: string | null) {
	if (!value) return ''

	return trimLeadingSlash(value)
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/['’‘`"]/g, '')
		.replace(/[“”]/g, '')
}

export function isAbsoluteUrl(value?: string | null) {
	return !!value && ABSOLUTE_URL_PATTERN.test(value)
}

export function resolveVocabMediaUrl(value?: string | null) {
	if (!value) return ''
	if (isAbsoluteUrl(value)) return value

	const normalizedPath = trimLeadingSlash(value)
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '')
	const bucket = process.env.NEXT_PUBLIC_SUPABASE_VOCAB_BUCKET?.trim()

	if (supabaseUrl && bucket) {
		return `${supabaseUrl}/storage/v1/object/public/${bucket}/${normalizeVocabStoragePath(value)}`
	}

	return value.startsWith('/') ? value : `/${normalizedPath}`
}

export function resolveVocabMediaUrls(values?: string[] | null) {
	return (values ?? []).map((value) => resolveVocabMediaUrl(value)).filter(Boolean)
}
