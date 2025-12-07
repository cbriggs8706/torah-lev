// i18n/config.ts

export const LOCALES = [
	'en', // English
	'es', // Spanish
	'pt', // Portuguese
	'nl', // Dutch
	'he', // Hebrew
	'el', // Greek
	'sw', // Swahili
	'fr', // French

	// Additional major Hebrew-learner languages:
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
	'fa', // Persian (Farsi)
	'tr', // Turkish
	'cs', // Czech
	'jp', // Japanese
] as const

export type Locale = (typeof LOCALES)[number]

export const defaultLocale: Locale = 'en'
