// lib/hebrew/segmentHebrewWordHybrid.ts

// Splitters: whitespace + common punctuation + Hebrew marks used as separators
const SPLITTERS = /[\s\u05BE\u05C0\u05C3.,;:!?׳״"'()\[\]{}<>]+/g

// Inseparable prefixes: ו כ מ ל ב ה ש
const PREFIX_LETTERS = new Set(['ו', 'כ', 'מ', 'ל', 'ב', 'ה', 'ש'])
const HEBREW_LETTER_RE = /[\u05D0-\u05EA]/
const HEBREW_MARK_RE = /[\u0591-\u05C7]/

function splitHebrewClusters(part: string): string[] {
	const clusters: string[] = []
	let i = 0

	while (i < part.length) {
		const ch = part[i]

		if (!HEBREW_LETTER_RE.test(ch)) {
			i++
			continue
		}

		let cluster = ch
		i++

		while (i < part.length && HEBREW_MARK_RE.test(part[i])) {
			cluster += part[i]
			i++
		}

		clusters.push(cluster)
	}

	return clusters
}

export function segmentHebrewWordHybrid(surface: string): string[] {
	// 1. Split by whitespace/marks/punctuation into lexical parts
	const rawParts = surface.split(SPLITTERS).filter(Boolean)

	const segments: string[] = []

	for (const part of rawParts) {
		const clusters = splitHebrewClusters(part)
		if (clusters.length === 0) continue

		// 2. Extract prefix clusters only when the remaining lexical body is substantial.
		// This prevents splitting short standalone lexemes like "מַה" into "מַ" + "ה".
		while (clusters.length > 2) {
			const firstCluster = clusters[0]
			const firstLetter = firstCluster[0]

			if (!PREFIX_LETTERS.has(firstLetter)) break

			segments.push(firstCluster)
			clusters.shift()
		}

		// 3. Remaining body is the lexeme
		if (clusters.length > 0) {
			segments.push(clusters.join(''))
		}
	}

	return segments
}
