//i18n/requests.ts
import { getRequestConfig } from 'next-intl/server'
import fs from 'fs'
import path from 'path'

// 👇 List of supported locales in your app
const SUPPORTED_LOCALES = [
	'en', // English
	'es', // Spanish
	'nl', // Dutch
	'pt', // Portuguese
	'he', // Hebrew
	'el', // Greek
	'sw', // Swahili
	'fr', // French

	'ru', // Russian
	'ar', // Arabic
	'am', // Amharic
	'uk', // Ukrainian
	'de', // German
	'it', // Italian
	'zh', // Chinese (Mandarin)
	'ko', // Korean
	'pl', // Polish
	'hu', // Hungarian
	'sv', // Swedish
	'ja', // Japanese
	'fa', // Farsi (Persian)
	'tr', // Turkish
	'cs', // Czech
	'jp', // Japanese
] as const

export type Locale = (typeof SUPPORTED_LOCALES)[number]

async function loadAllMessages(locale: string) {
	// ✅ Guarantee valid locale folder exists
	if (!SUPPORTED_LOCALES.includes(locale as Locale)) {
		console.warn(`[i18n] Invalid locale "${locale}" — falling back to "en"`)
		locale = 'en'
	}

	const dir = path.join(process.cwd(), 'messages', locale)
	if (!fs.existsSync(dir)) {
		console.warn(
			`[i18n] Missing messages folder for locale "${locale}" (${dir})`
		)
		return {}
	}

	const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'))
	const messages: Record<string, Record<string, unknown>> = {}

	for (const file of files) {
		const namespace = path.basename(file, '.json')
		const content = fs.readFileSync(path.join(dir, file), 'utf-8')
		messages[namespace] = JSON.parse(content)
	}

	return messages
}

export default getRequestConfig(async ({ locale }) => {
	const resolvedLocale =
		locale && SUPPORTED_LOCALES.includes(locale as Locale) ? locale : 'en'

	const messages = await loadAllMessages(resolvedLocale)

	return {
		locale: resolvedLocale,
		messages,
	}
})
