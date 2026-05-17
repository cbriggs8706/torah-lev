export type HebrewVocab = {
	id: number | null
	hebNiqqud: string
	heb: string
	eng: string
	engDefinition?: string
	genderPerson?: string
	rootPerson?: string
	rootGender?: string
	rootNumber?: string
	suffixPerson?: string
	suffixGender?: string
	suffixNumber?: string
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
	definite?: boolean
	category?: string
	introduction?: string
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
	definite?: boolean
	category?: string
}

export type EnglishVocab = {
	id: number | null
	lessons: string[]
	type?: string
	definite?: boolean
	engDefinition?: string
	eng: string
	spa: string
	por: string
	spaTransliteration: string
	porTransliteration: string
	rootPerson?: string
	rootGender?: string
	rootNumber?: string
	suffixPerson?: string
	suffixGender?: string
	suffixNumber?: string
	partOfSpeech?: string[] // or string if singular
	ipa?: string
	images: string[]
	engAudio: string
	category?: string
}

export type AnyVocab = EnglishVocab | HebrewVocab | GreekVocab
