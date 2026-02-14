// lib/hebrew/ingestCustomHebrewText.ts

export function normalizeHebrewToConsonants(str: string): string {
	return str
		.normalize('NFKD')
		.replace(/[\u0591-\u05C7]/g, '') // niqqud + trop
		.replace(/[\u05BD\u05BF\u05C4\u05C5]/g, '') // misc marks
		.normalize('NFC')
		.replace(/[^א-ת]/g, '')
		.trim()
}
