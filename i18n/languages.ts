//i18n/languages.ts
export const LANGUAGES: Record<string, { label: string; flag: string }> = {
	// Existing
	en: { label: 'English', flag: 'fi-us' },
	es: { label: 'Español', flag: 'fi-es' },
	nl: { label: 'Nederlands', flag: 'fi-nl' },
	pt: { label: 'Português', flag: 'fi-br' },
	he: { label: 'עברית', flag: 'fi-il' },
	el: { label: 'Ελληνική', flag: 'fi-gr' },
	sw: { label: 'Kiswahili', flag: 'fi-ke' },
	fr: { label: 'Français', flag: 'fi-fr' },

	// New languages based on global Hebrew-learner demand

	// 1. Russian
	ru: { label: 'Русский', flag: 'fi-ru' },

	// 2. Arabic
	ar: { label: 'العربية', flag: 'fi-sa' }, // Saudi flag = most standard representation

	// 3. Amharic
	am: { label: 'አማርኛ', flag: 'fi-et' },

	// 4. Ukrainian
	uk: { label: 'Українська', flag: 'fi-ua' },

	// 5. German
	de: { label: 'Deutsch', flag: 'fi-de' },

	// 6. Italian
	it: { label: 'Italiano', flag: 'fi-it' },

	// 7. Chinese (Simplified Mandarin)
	zh: { label: '中文', flag: 'fi-cn' },

	// 8. Korean
	ko: { label: '한국어', flag: 'fi-kr' },

	// 9. Polish
	pl: { label: 'Polski', flag: 'fi-pl' },

	// 10. Hungarian
	hu: { label: 'Magyar', flag: 'fi-hu' },

	// 11. Swedish
	sv: { label: 'Svenska', flag: 'fi-se' },

	// 12. Japanese
	ja: { label: '日本語', flag: 'fi-jp' },

	// 13. Persian (Farsi)
	fa: { label: 'فارسی', flag: 'fi-ir' },

	// 14. Turkish
	tr: { label: 'Türkçe', flag: 'fi-tr' },

	// 15. Czech
	cs: { label: 'Čeština', flag: 'fi-cz' },
}
