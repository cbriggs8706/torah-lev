import {
	HEBREW_VOWEL_BANK_ITEMS,
	type HebrewVowelBankItem,
} from '@/lib/data/hebrew/hebrew-vowel-bank'

export type HistoricVowelShiftMode = 'reduce' | 'lengthen'

export type HistoricVowelShiftRow = {
	id: 'a-class' | 'i-class' | 'u-class'
	label: string
	protoSemitic: string
	historicShortKeys: string[]
	reducedKeys: string[]
	lengthenedKeys: string[]
	historicLongKeys: string[]
	note?: string
}

const vowelBankByKey = new Map(
	HEBREW_VOWEL_BANK_ITEMS.map((item) => [item.key, item] as const)
)

export const HISTORIC_VOWEL_SHIFT_ROWS: HistoricVowelShiftRow[] = [
	{
		id: 'a-class',
		label: 'A-Class',
		protoSemitic: 'a-class',
		historicShortKeys: ['patach'],
		reducedKeys: ['shva', 'chataf-patach'],
		lengthenedKeys: ['kamatz-gadol'],
		historicLongKeys: ['kamatz-malei'],
		note: 'Kamatz malei is uncommon, but it helps show the long side of the pattern.',
	},
	{
		id: 'i-class',
		label: 'I-Class',
		protoSemitic: 'i-class',
		historicShortKeys: ['segol', 'chiriq'],
		reducedKeys: ['shva', 'chataf-segol'],
		lengthenedKeys: ['tsere'],
		historicLongKeys: ['tsere-malei', 'segol-malei', 'chiriq-malei'],
	},
	{
		id: 'u-class',
		label: 'U-Class',
		protoSemitic: 'u-class',
		historicShortKeys: ['kamatz-katan', 'kubutz'],
		reducedKeys: ['shva', 'chataf-kamatz'],
		lengthenedKeys: ['cholam'],
		historicLongKeys: ['cholam-malei', 'shuruk'],
	},
]

export function getHistoricVowelShiftTargets(
	mode: HistoricVowelShiftMode
): HebrewVowelBankItem[] {
	const keys = new Set(
		HISTORIC_VOWEL_SHIFT_ROWS.flatMap((row) =>
			mode === 'reduce' ? row.reducedKeys : row.lengthenedKeys
		)
	)

	return [...keys]
		.map((key) => vowelBankByKey.get(key))
		.filter((item): item is HebrewVowelBankItem => Boolean(item))
}

export function getHistoricVowelShiftItems(keys: string[]): HebrewVowelBankItem[] {
	return keys
		.map((key) => vowelBankByKey.get(key))
		.filter((item): item is HebrewVowelBankItem => Boolean(item))
}
