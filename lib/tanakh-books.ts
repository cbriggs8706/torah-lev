import type { SidebarLocale } from '@/types/sidebar'

export const TANAKH_BOOKS = [
	'Genesis',
	'Exodus',
	'Leviticus',
	'Numbers',
	'Deuteronomy',
	'Joshua',
	'Judges',
	'1 Samuel',
	'2 Samuel',
	'1 Kings',
	'2 Kings',
	'Isaiah',
	'Jeremiah',
	'Ezekiel',
	'Hosea',
	'Joel',
	'Amos',
	'Obadiah',
	'Jonah',
	'Micah',
	'Nahum',
	'Habakkuk',
	'Zephaniah',
	'Haggai',
	'Zechariah',
	'Malachi',
	'Psalms',
	'Proverbs',
	'Job',
	'Song of Songs',
	'Ruth',
	'Lamentations',
	'Ecclesiastes',
	'Esther',
	'Daniel',
	'Ezra',
	'Nehemiah',
	'1 Chronicles',
	'2 Chronicles',
] as const

export type TanakhBook = (typeof TANAKH_BOOKS)[number]

export const TANAKH_BOOK_CHOICES = TANAKH_BOOKS.map((book) => ({
	id: book,
	name: book,
}))

export const TANAKH_BOOK_HEBREW_NAMES: Record<TanakhBook, string> = {
	Genesis: 'בראשית',
	Exodus: 'שמות',
	Leviticus: 'ויקרא',
	Numbers: 'במדבר',
	Deuteronomy: 'דברים',
	Joshua: 'יהושע',
	Judges: 'שופטים',
	'1 Samuel': 'שמואל א׳',
	'2 Samuel': 'שמואל ב׳',
	'1 Kings': 'מלכים א׳',
	'2 Kings': 'מלכים ב׳',
	Isaiah: 'ישעיהו',
	Jeremiah: 'ירמיהו',
	Ezekiel: 'יחזקאל',
	Hosea: 'הושע',
	Joel: 'יואל',
	Amos: 'עמוס',
	Obadiah: 'עובדיה',
	Jonah: 'יונה',
	Micah: 'מיכה',
	Nahum: 'נחום',
	Habakkuk: 'חבקוק',
	Zephaniah: 'צפניה',
	Haggai: 'חגי',
	Zechariah: 'זכריה',
	Malachi: 'מלאכי',
	Psalms: 'תהלים',
	Proverbs: 'משלי',
	Job: 'איוב',
	'Song of Songs': 'שיר השירים',
	Ruth: 'רות',
	Lamentations: 'איכה',
	Ecclesiastes: 'קהלת',
	Esther: 'אסתר',
	Daniel: 'דניאל',
	Ezra: 'עזרא',
	Nehemiah: 'נחמיה',
	'1 Chronicles': 'דברי הימים א׳',
	'2 Chronicles': 'דברי הימים ב׳',
}

export function getTanakhBookOrder(book?: string | null) {
	if (!book) return Number.POSITIVE_INFINITY
	const index = TANAKH_BOOKS.indexOf(book as TanakhBook)
	return index === -1 ? Number.POSITIVE_INFINITY : index
}

export function getTanakhBookHebrewName(book?: string | null) {
	if (!book) return 'לא משויך'
	return TANAKH_BOOK_HEBREW_NAMES[book as TanakhBook] ?? book
}

export function getTanakhBookDisplayName(
	book?: string | null,
	locale: SidebarLocale = 'en',
) {
	if (!book) {
		return locale === 'he' ? 'לא משויך' : 'Unassigned'
	}

	if (locale === 'he') return getTanakhBookHebrewName(book)
	return book
}
