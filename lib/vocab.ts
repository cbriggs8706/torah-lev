export type Flashcard = {
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
