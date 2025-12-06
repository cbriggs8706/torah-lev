export function analyzeHebrewWord(surface: string) {
	// TODO: plug ETCBC lexicon lookup
	// TEMP placeholder logic:

	const lemmaVocalized = surface.replace(/[\u0591-\u05AF]/g, '')
	const lemma = lemmaVocalized.replace(/[\u05B0-\u05C7]/g, '')

	return {
		lemma,
		lemmaVocalized,
		partOfSpeech: null,
		verbStem: null,
		verbTense: null,
	}
}
