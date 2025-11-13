export const LOCALES = ['en', 'es', 'pt', 'nl', 'he', 'el'] as const
export type Locale = (typeof LOCALES)[number]

export const defaultLocale: Locale = 'en'
