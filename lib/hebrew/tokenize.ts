// lib/hebrew/tokenize.ts
export function tokenizeHebrew(text: string): string[] {
	return text
		.split(/\s+/) // split on whitespace only
		.map((w) => w.trim())
		.filter(Boolean)
}
