import { hebrewNiqqud } from '@/lib/data/hebrew/hebrew-niqqud'

export type HebrewVowelLengthBucket = 'short' | 'long'
export type HebrewVowelClassBucket = 'a-class' | 'i-class' | 'u-class'

export type HebrewVowelBankItem = {
	id: string
	text: string
	type: 'suffix'
	name: string
	key: string
	lengthBucket: HebrewVowelLengthBucket
	classBucket: HebrewVowelClassBucket
}

const NON_VOWEL_KEYS = new Set(['dagesh', 'rafe', 'shin-dot'])
const DOTTED_CIRCLE = '\u25CC'
const RIGHT_TO_LEFT_MARK = '\u200F'

const SHORT_VOWEL_KEYS = new Set([
	'shva',
	'chataf-segol',
	'chataf-patach',
	'chataf-kamatz',
	'chiriq',
	'segol',
	'patach',
	'kamatz-katan',
	'kubutz',
])

const VOWEL_CLASS_BY_KEY: Record<string, HebrewVowelClassBucket> = {
	shva: 'i-class',
	'chataf-segol': 'i-class',
	'chataf-patach': 'a-class',
	'chataf-kamatz': 'u-class',
	chiriq: 'i-class',
	'chiriq-malei': 'i-class',
	tsere: 'i-class',
	'tsere-malei': 'i-class',
	segol: 'i-class',
	'segol-malei': 'i-class',
	patach: 'a-class',
	'patach-malei': 'a-class',
	'kamatz-gadol': 'a-class',
	'kamatz-malei': 'a-class',
	'kamatz-katan': 'u-class',
	cholam: 'u-class',
	'cholam-malei': 'u-class',
	kubutz: 'u-class',
	shuruk: 'u-class',
}

export const HEBREW_VOWEL_BANK_ITEMS: HebrewVowelBankItem[] = hebrewNiqqud
	.filter((item) => !NON_VOWEL_KEYS.has(item.key))
	.map((item, index) => ({
		id: `suffix-${index}`,
		text: item.char.slice(1),
		type: 'suffix' as const,
		name: item.name,
		key: item.key,
		lengthBucket: SHORT_VOWEL_KEYS.has(item.key) ? 'short' : 'long',
		classBucket: VOWEL_CLASS_BY_KEY[item.key] ?? 'a-class',
	}))

export function formatHebrewBankPieceDisplay(text: string) {
	if (!text) return text

	const [firstChar] = Array.from(text)
	const displayText = /\p{Mark}/u.test(firstChar)
		? `${DOTTED_CIRCLE}${text}`
		: text

	// Prefix a strong RTL mark so mixed neutral/mark sequences render in Hebrew order.
	return `${RIGHT_TO_LEFT_MARK}${displayText}`
}
