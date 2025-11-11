import { getRequestConfig } from 'next-intl/server'
import fs from 'fs'
import path from 'path'

async function loadAllMessages(locale: string) {
	const dir = path.join(process.cwd(), 'messages', locale)
	const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'))

	const messages: Record<string, Record<string, unknown>> = {}
	for (const file of files) {
		const namespace = path.basename(file, '.json') // e.g., 'common'
		const content = fs.readFileSync(path.join(dir, file), 'utf-8')
		messages[namespace] = JSON.parse(content)
	}

	return messages
}

export default getRequestConfig(async ({ locale }) => {
	// ✅ Guarantee a locale, fallback to English
	const resolvedLocale = locale ?? 'en'

	const messages = await loadAllMessages(resolvedLocale)

	return {
		locale: resolvedLocale,
		messages,
	}
})
