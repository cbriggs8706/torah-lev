export const LOCALES = ['en', 'es', 'pt', 'nl', 'he'] as const
export type Locale = (typeof LOCALES)[number]

export const defaultLocale: Locale = 'en'
