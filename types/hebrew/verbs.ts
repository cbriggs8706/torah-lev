export type FutureConjugationTable = {
	strongs: number
	tense: string
	rows: FutureConjugationRow[]
}

export type FutureConjugationRow = {
	person:
		| '1sc' // first-person singular common
		| '1pc' // first-person plural common
		| '2ms' // second-person masculine singular
		| '2fs' // second-person feminine singular
		| '2mp' // second-person masculine plural
		| '2fp' // second-person feminine plural
		| '3ms' // third-person masculine singular
		| '3fs' // third-person feminine singular
		| '3mp' // third-person masculine plural
		| '3fp' // third-person feminine plural
	hebrew: HebrewChar[]
	translit: TransliterationPart[]
	english: EnglishPart[]
}

export type ImperativeConjugationTable = {
	strongs: number
	tense: 'Imperative'
	rows: ImperativeConjugationRow[]
}

export type ImperativeConjugationRow = {
	number: 's' | 'p' // singular / plural
	gender: 'm' | 'f' // masculine / feminine
	hebrew: HebrewChar[]
	translit: TransliterationPart[]
	english: EnglishPart[]
}

export type InfinitiveConjugationTable = {
	strongs: number
	tense: 'Infinitive'
	rows: InfinitiveConjugationRow[]
}

export type InfinitiveConjugationRow = {
	person: 'inf'
	hebrew: HebrewChar[]
	translit: TransliterationPart[]
	english: EnglishPart[]
}

export type PastConjugationTable = {
	strongs: number
	tense: 'Past (Qatal)'
	rows: PastConjugationRow[]
}

export type PastConjugationRow = {
	person:
		| '1sc' // first-person singular
		| '1pc' // first-person plural
		| '2ms' // second-person masculine singular
		| '2fs' // second-person feminine singular
		| '2mp' // second-person masculine plural
		| '2fp' // second-person feminine plural
		| '3ms' // third-person masculine singular
		| '3fs' // third-person feminine singular
		| '3mp' // third-person masculine plural
		| '3fp' // third-person feminine plural
	hebrew: HebrewChar[]
	translit: TransliterationPart[]
	english: EnglishPart[]
}

export type PresentConjugationTable = {
	strongs: number
	tense: 'Present (Participle)'
	rows: PresentConjugationRow[]
}

export type PresentConjugationRow = {
	number: 's' | 'p' // singular / plural
	gender: 'm' | 'f' // masculine / feminine
	hebrew: HebrewChar[]
	translit: TransliterationPart[]
	english: EnglishPart[]
}

export type VayyiqtolConjugationTable = {
	strongs: number
	tense: 'Vayyiqtol (Biblical Narrative)'
	rows: VayyiqtolConjugationRow[]
}

export type VayyiqtolConjugationRow = {
	person: '3ms' | '3fs' | '3mp' | '3fp'
	hebrew: HebrewChar[]
	translit: TransliterationPart[]
	english: EnglishPart[]
}

export type HebrewChar = {
	char: string
	class: string
}

export type TransliterationPart = {
	text: string
	class: string
}

export type EnglishPart = {
	text: string
	class: string
}
