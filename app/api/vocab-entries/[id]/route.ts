import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import db from '@/db/drizzle'
import { vocabEntries } from '@/db/schema'
import { isAdmin } from '@/lib/admin'
import { toVocabAdminRecord } from '@/lib/admin-vocab'
import { normalizeVocabStoragePath } from '@/lib/vocab-media'

type Params = { params: Promise<{ id: string }> }

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

function normalizeBoolean(value: unknown) {
	return value === true || value === 'true' || value === 1 || value === '1'
}

function parseStringList(input: unknown) {
	if (Array.isArray(input)) {
		return input
			.map((value) => (typeof value === 'string' ? value.trim() : ''))
			.filter(Boolean)
	}

	if (typeof input !== 'string') return []

	return input
		.split(/\r?\n|,/)
		.map((value) => value.trim())
		.filter(Boolean)
}

function normalizeMediaList(values: unknown) {
	return parseStringList(values).map((value) => normalizeVocabStoragePath(value))
}

function normalizeRecord(body: Record<string, unknown>) {
	const hebAudio = normalizeNullableString(body.hebAudio)
	const engAudio = normalizeNullableString(body.engAudio)
	const grkAudio = normalizeNullableString(body.grkAudio)

	const row = {
		sourceKey: normalizeNullableString(body.sourceKey) ?? 'awb',
		language: normalizeNullableString(body.language) ?? 'he',
		courseId: normalizeOptionalNumber(body.courseId),
		entryId: normalizeOptionalNumber(body.entryId) ?? 0,
		lessons: parseStringList(body.lessonsText ?? body.lessons),
		type: normalizeNullableString(body.type),
		definite: normalizeBoolean(body.definite),
		category: normalizeNullableString(body.category),
		eng: normalizeNullableString(body.eng),
		engDefinition: normalizeNullableString(body.engDefinition),
		partOfSpeech: parseStringList(body.partOfSpeechText ?? body.partOfSpeech),
		ipa: normalizeNullableString(body.ipa),
		images: normalizeMediaList(body.imagesText ?? body.images),
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
		synonyms: parseStringList(body.synonymsText ?? body.synonyms),
		antonyms: parseStringList(body.antonymsText ?? body.antonyms),
		scriptures: parseStringList(body.scripturesText ?? body.scriptures),
		strongs: normalizeNullableString(body.strongs),
		introduction: normalizeNullableString(body.introduction),
		absoluteEntryId: normalizeOptionalNumber(body.absoluteEntryId),
	}

	return {
		...row,
		payload: row,
		updatedAt: new Date(),
	}
}

async function validateConstructAbsoluteLink(
	id: number,
	normalized: ReturnType<typeof normalizeRecord>
) {
	if (
		normalized.category?.trim().toLowerCase() === 'construct' &&
		!normalized.absoluteEntryId
	) {
		return 'Construct entries require an absolute entry.'
	}

	if (!normalized.absoluteEntryId) {
		return null
	}

	if (normalized.absoluteEntryId === id) {
		return 'A vocab entry cannot point to itself as its absolute form.'
	}

	const target = await db.query.vocabEntries.findFirst({
		where: eq(vocabEntries.id, normalized.absoluteEntryId),
		columns: { id: true },
	})

	if (!target) {
		return 'Absolute entry not found.'
	}

	return null
}

function parseId(id: string) {
	const parsed = Number(id)
	return Number.isFinite(parsed) ? parsed : null
}

export const GET = async (_req: Request, { params }: Params) => {
	if (!(await isAdmin())) {
		return new NextResponse('Unauthorized', { status: 403 })
	}

	const id = parseId((await params).id)
	if (!id) return new NextResponse('Invalid ID', { status: 400 })

	const data = await db.query.vocabEntries.findFirst({
		where: eq(vocabEntries.id, id),
	})

	if (!data) return new NextResponse('Not Found', { status: 404 })
	return NextResponse.json(toVocabAdminRecord(data))
}

export const PUT = async (req: Request, { params }: Params) => {
	if (!(await isAdmin())) {
		return new NextResponse('Unauthorized', { status: 403 })
	}

	const id = parseId((await params).id)
	if (!id) return new NextResponse('Invalid ID', { status: 400 })

	const body = (await req.json()) as Record<string, unknown>
	const normalized = normalizeRecord(body)
	const validationError = await validateConstructAbsoluteLink(id, normalized)
	if (validationError) {
		return new NextResponse(validationError, { status: 400 })
	}

	const data = await db
		.update(vocabEntries)
		.set(normalized)
		.where(eq(vocabEntries.id, id))
		.returning()

	if (!data.length) return new NextResponse('Not Found', { status: 404 })
	return NextResponse.json(toVocabAdminRecord(data[0]))
}

export const DELETE = async (_req: Request, { params }: Params) => {
	if (!(await isAdmin())) {
		return new NextResponse('Unauthorized', { status: 403 })
	}

	const id = parseId((await params).id)
	if (!id) return new NextResponse('Invalid ID', { status: 400 })

	const data = await db
		.delete(vocabEntries)
		.where(eq(vocabEntries.id, id))
		.returning()

	if (!data.length) return new NextResponse('Not Found', { status: 404 })
	return NextResponse.json(toVocabAdminRecord(data[0]))
}
