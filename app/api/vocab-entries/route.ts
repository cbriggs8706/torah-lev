import { NextResponse } from 'next/server'
import { asc, desc, eq } from 'drizzle-orm'
import db from '@/db/drizzle'
import { vocabEntries } from '@/db/schema'
import { isAdmin } from '@/lib/admin'
import {
	getLessonSortValue,
	normalizeMediaList,
	parseStringList,
	toVocabAdminRecord,
} from '@/lib/admin-vocab'
import { normalizeVocabStoragePath } from '@/lib/vocab-media'

function normalizeNullableString(value: unknown) {
	if (typeof value !== 'string') return null
	const trimmed = value.trim()
	return trimmed.length ? trimmed : null
}

function normalizeOptionalNumber(value: unknown) {
	if (value === '' || value === null || value === undefined) return null
	const parsed = Number(value)
	return Number.isFinite(parsed) ? parsed : null
}

function normalizeRecord(body: Record<string, unknown>) {
	const language = normalizeNullableString(body.language) ?? 'he'
	const images = normalizeMediaList(body.imagesText ?? body.images)
	const lessons = parseStringList(body.lessonsText ?? body.lessons)
	const partOfSpeech = parseStringList(body.partOfSpeechText ?? body.partOfSpeech)
	const synonyms = parseStringList(body.synonymsText ?? body.synonyms)
	const antonyms = parseStringList(body.antonymsText ?? body.antonyms)
	const scriptures = parseStringList(body.scripturesText ?? body.scriptures)
	const hebAudio = normalizeNullableString(body.hebAudio)
	const engAudio = normalizeNullableString(body.engAudio)
	const grkAudio = normalizeNullableString(body.grkAudio)

	const row = {
		sourceKey: normalizeNullableString(body.sourceKey) ?? 'awb',
		language,
		courseId: normalizeOptionalNumber(body.courseId),
		entryId: normalizeOptionalNumber(body.entryId) ?? 0,
		lessons,
		type: normalizeNullableString(body.type),
		category: normalizeNullableString(body.category),
		eng: normalizeNullableString(body.eng),
		engDefinition: normalizeNullableString(body.engDefinition),
		partOfSpeech,
		ipa: normalizeNullableString(body.ipa),
		images,
		hebNiqqud: normalizeNullableString(body.hebNiqqud),
		heb: normalizeNullableString(body.heb),
		hebAudio: hebAudio ? normalizeVocabStoragePath(hebAudio) : null,
		grk: normalizeNullableString(body.grk),
		grkAudio: grkAudio ? normalizeVocabStoragePath(grkAudio) : null,
		spa: normalizeNullableString(body.spa),
		por: normalizeNullableString(body.por),
		engAudio: engAudio ? normalizeVocabStoragePath(engAudio) : null,
		engTransliteration: normalizeNullableString(body.engTransliteration),
		spaTransliteration: normalizeNullableString(body.spaTransliteration),
		porTransliteration: normalizeNullableString(body.porTransliteration),
		genderPerson: normalizeNullableString(body.genderPerson),
		person: normalizeNullableString(body.person),
		gender: normalizeNullableString(body.gender),
		number: normalizeNullableString(body.number),
		dictionaryUrl: normalizeNullableString(body.dictionaryUrl),
		synonyms,
		antonyms,
		scriptures,
		strongs: normalizeNullableString(body.strongs),
		introduction: normalizeNullableString(body.introduction),
	}

	return {
		...row,
		payload: row,
		updatedAt: new Date(),
	}
}

async function getNextEntryId(sourceKey: string) {
	const [latestRow] = await db
		.select({ entryId: vocabEntries.entryId })
		.from(vocabEntries)
		.where(eq(vocabEntries.sourceKey, sourceKey))
		.orderBy(desc(vocabEntries.entryId))
		.limit(1)

	return (latestRow?.entryId ?? 0) + 1
}

export const GET = async (req: Request) => {
	if (!(await isAdmin())) {
		return new NextResponse('Unauthorized', { status: 401 })
	}

	const { searchParams } = new URL(req.url)
	const sort = JSON.parse(searchParams.get('sort') || '["id","ASC"]') as [
		string,
		string,
	]
	const range = JSON.parse(searchParams.get('range') || '[0,24]') as [number, number]
	const filter = JSON.parse(searchParams.get('filter') || '{}') as Record<
		string,
		unknown
	>

	const baseRows = await db.query.vocabEntries.findMany({
		orderBy: asc(vocabEntries.id),
	})

	let rows = baseRows.map((row) => toVocabAdminRecord(row))

	if (Array.isArray(filter.id) && filter.id.length > 0) {
		const idSet = new Set(filter.id.map((value) => Number(value)))
		rows = rows.filter((row) => idSet.has(row.id))
	}

	if (typeof filter.q === 'string' && filter.q.trim()) {
		const query = filter.q.trim().toLowerCase()
		rows = rows.filter((row) =>
			[
				row.eng,
				row.heb,
				row.hebNiqqud,
				row.grk,
				row.spa,
				row.por,
				row.engDefinition,
				row.sourceKey,
				row.category,
				row.type,
			]
				.filter(Boolean)
				.some((value) => String(value).toLowerCase().includes(query))
		)
	}

	if (typeof filter.language === 'string' && filter.language.trim()) {
		rows = rows.filter((row) => row.language === filter.language)
	}

	if (typeof filter.sourceKey === 'string' && filter.sourceKey.trim()) {
		rows = rows.filter((row) => row.sourceKey === filter.sourceKey)
	}

	if (typeof filter.category === 'string' && filter.category.trim()) {
		const categoryQuery = filter.category.trim().toLowerCase()
		rows = rows.filter((row) =>
			String(row.category ?? '')
				.toLowerCase()
				.includes(categoryQuery)
		)
	}

	if (typeof filter.lesson === 'string' && filter.lesson.trim()) {
		const lessonQuery = filter.lesson.trim().toLowerCase()
		rows = rows.filter((row) =>
			row.lessons.some((lesson) => lesson.toLowerCase().includes(lessonQuery))
		)
	}

	if (filter.missingImage === true) {
		rows = rows.filter((row) => row.missingImage)
	}

	if (filter.missingAudio === true) {
		rows = rows.filter((row) => row.missingAudio)
	}

	if (filter.missingIntroduction === true) {
		rows = rows.filter((row) => !row.introduction)
	}

	const [sortField, sortOrder] = sort
	const direction = sortOrder?.toUpperCase() === 'DESC' ? -1 : 1

	rows.sort((a, b) => {
		const aValue =
			sortField === 'lessonSort'
				? a.lessonSort
				: sortField === 'firstLesson'
				? a.firstLesson
				: (a as Record<string, unknown>)[sortField]
		const bValue =
			sortField === 'lessonSort'
				? b.lessonSort
				: sortField === 'firstLesson'
				? b.firstLesson
				: (b as Record<string, unknown>)[sortField]

		const left = aValue ?? ''
		const right = bValue ?? ''

		if (typeof left === 'number' && typeof right === 'number') {
			return (left - right) * direction
		}

		return String(left).localeCompare(String(right), undefined, {
			numeric: true,
			sensitivity: 'base',
		}) * direction
	})

	const [start, end] = range
	const pagedRows = rows.slice(start, end + 1)

	return new NextResponse(JSON.stringify(pagedRows), {
		headers: {
			'X-Total-Count': rows.length.toString(),
			'Access-Control-Expose-Headers': 'X-Total-Count',
		},
	})
}

export const POST = async (req: Request) => {
	if (!(await isAdmin())) {
		return new NextResponse('Unauthorized', { status: 401 })
	}

	const body = (await req.json()) as Record<string, unknown>
	const normalized = normalizeRecord(body)
	const entryId = normalized.entryId > 0
		? normalized.entryId
		: await getNextEntryId(normalized.sourceKey)

	const data = await db
		.insert(vocabEntries)
		.values({
			...normalized,
			entryId,
			createdAt: new Date(),
		})
		.returning()

	return NextResponse.json(toVocabAdminRecord(data[0]))
}
