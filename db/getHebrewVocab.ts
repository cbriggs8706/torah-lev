import { arrayOverlaps, sql } from 'drizzle-orm'
import { hebrewWords, hebrewWordForms } from '@/db/schema'
import type { InferSelectModel } from 'drizzle-orm'
import type { HebrewVocab } from '@/lib/vocab'
import db from './drizzle'

type Word = InferSelectModel<typeof hebrewWords>
type WordForm = InferSelectModel<typeof hebrewWordForms>
const toStr = (x: string | null | undefined) => x ?? ''
const toArr = <T extends string>(x: T[] | null | undefined): T[] => x ?? []

type GetHebrewVocabOpts = {
	lessons?: string | string[] // e.g. "12" | ["12", "12b", "13"]
	includeForms?: boolean // default true
}

function toArray<T>(x: T | T[] | undefined | null): T[] {
	if (!x) return []
	return Array.isArray(x) ? x : [x]
}

function toGenderPerson(
	gender?: string | null,
	person?: number | null,
	number?: string | null
) {
	// shape it however your UI expects (you already use "genderPerson")
	// common formats: "m sg 3p" or "masc; 3rd; plural"
	const chunks = [
		gender ?? undefined,
		number ?? undefined,
		person ? `${person}p` : undefined,
	].filter(Boolean)
	return chunks.join(' ')
}

// Normalize DB rows to your HebrewVocab interface
function mapWordToVocab(w: Word): HebrewVocab {
	return {
		id: w.id,
		hebNiqqud: w.hebNiqqud, // not null in schema
		heb: w.heb, // not null in schema
		eng: w.eng, // not null in schema
		genderPerson: toStr(
			[w.gender, w.number, w.person ? `${w.person}p` : '']
				.filter(Boolean)
				.join(' ')
		),
		partOfSpeech: toArr(w.partOfSpeech),
		ipa: toStr(w.ipa),
		engTransliteration: toStr(w.engTransliteration),
		images: toArr(w.images),
		hebAudio: toStr(w.hebAudio), // <<< never undefined now
		lessons: toArr(w.lessons),
		strongs: toStr(w.strongs),
		type: toStr(w.type),
		category: toStr(w.category),
	}
}

function mapFormToVocab(f: WordForm): HebrewVocab {
	return {
		id: f.id,
		hebNiqqud: f.hebNiqqud, // not null in schema
		heb: toStr(f.heb) || f.hebNiqqud, // fallback to niqqud if bare not stored
		eng: toStr(f.eng),
		genderPerson: toStr(
			[f.gender, f.number, f.person ? `${f.person}p` : '']
				.filter(Boolean)
				.join(' ')
		),
		partOfSpeech: [], // or derive from base if you want
		ipa: toStr(f.ipa),
		engTransliteration: toStr(f.engTransliteration),
		images: toArr(f.images),
		hebAudio: toStr(f.hebAudio), // <<< never undefined now
		lessons: toArr(f.lessons),
		// strongs/type/category if you want to carry them on forms:
		strongs: '',
		type: toStr(f.formType),
		category: toStr(f.subtype),
	}
}

export async function getHebrewVocab(opts: GetHebrewVocabOpts = {}) {
	const { includeForms = true } = opts
	const lessonList = toArray(opts.lessons)

	const base = await db
		.select()
		.from(hebrewWords)
		.where(
			lessonList.length
				? arrayOverlaps(hebrewWords.lessons, lessonList)
				: undefined
		)

	// ---------- Forms ----------
	const forms: WordForm[] = includeForms
		? await db
				.select()
				.from(hebrewWordForms)
				.where(
					lessonList.length
						? arrayOverlaps(hebrewWordForms.lessons, lessonList)
						: undefined
				)
		: []

	// Normalize + merge
	const baseMapped = base.map(mapWordToVocab)
	const formsMapped = forms.map(mapFormToVocab)

	// If you want to de-duplicate by (hebNiqqud + eng) or something, do it here.
	// For now we simply concatenate.
	const merged: HebrewVocab[] = [...baseMapped, ...formsMapped]

	// You can sort if you want consistent ordering:
	// merged.sort((a, b) => (a.hebNiqqud || '').localeCompare(b.hebNiqqud || ''))

	return merged
}
