export type HebrewVocab = {
	id: number | null
	hebNiqqud: string
	heb: string
	eng: string
	engDefinition?: string
	genderPerson?: string
	partOfSpeech?: string[] // or string if singular
	ipa?: string
	engTransliteration?: string
	dictionaryUrl?: string
	images: string[]
	hebAudio: string
	engAudio?: string
	synonyms?: string[]
	antonyms?: string[]
	lessons: string[]
	scriptures?: string[]
	strongs?: string
	type?: string
	category?: string
}

export type GreekVocab = {
	id: number | null
	grk: string
	eng: string
	engDefinition?: string
	genderPerson?: string
	partOfSpeech?: string[] // or string if singular
	ipa?: string
	engTransliteration?: string
	dictionaryUrl?: string
	images: string[]
	grkAudio: string
	engAudio?: string
	synonyms?: string[]
	antonyms?: string[]
	lessons: string[]
	scriptures?: string[]
	strongs?: string
	type?: string
	category?: string
}

export type EnglishVocab = {
	id: number | null
	eng: string
	engDefinition?: string
	genderPerson?: string
	partOfSpeech?: string[] // or string if singular
	ipa?: string
	engTransliteration?: string
	dictionaryUrl?: string
	images: string[]
	engAudio: string
	synonyms?: string[]
	antonyms?: string[]
	lessons: string[]
	scriptures?: string[]
	strongs?: string
	type?: string
	category?: string
}
