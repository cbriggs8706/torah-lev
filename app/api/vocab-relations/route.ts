import { and, asc, eq, inArray } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import db from '@/db/drizzle'
import { vocabEntries } from '@/db/schema'
import { isAdmin } from '@/lib/admin'

type RelationKind = 'antonym' | 'synonym' | 'confused'

type VocabEntryRow = typeof vocabEntries.$inferSelect

function parsePositiveInt(value: string | null) {
	if (!value) return null
	const parsed = Number(value)
	return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function getRelationField(kind: RelationKind) {
	if (kind === 'synonym') return 'synonyms'
	if (kind === 'confused') return 'confusedWith'
	return 'antonyms'
}

function getRelationValues(row: VocabEntryRow, kind: RelationKind) {
	const field = getRelationField(kind)
	if (field === 'synonyms') return row.synonyms ?? []
	if (field === 'confusedWith') return row.confusedWith ?? []
	return row.antonyms ?? []
}

function updatePayloadRelations(
	payload: unknown,
	kind: RelationKind,
	values: string[]
) {
	const base =
		payload && typeof payload === 'object' && !Array.isArray(payload)
			? { ...(payload as Record<string, unknown>) }
			: {}

	base[getRelationField(kind)] = values
	return base
}

function getDisplayWord(row: Pick<
	VocabEntryRow,
	'lemma' | 'heb' | 'grk' | 'gloss' | 'spa' | 'por'
>) {
	return (
		row.lemma ??
		row.heb ??
		row.grk ??
		row.gloss ??
		row.spa ??
		row.por ??
		'(untitled)'
	)
}

function buildSummary(row: VocabEntryRow) {
	return {
		id: row.id,
		sourceKey: row.sourceKey,
		language: row.language,
		lessons: row.lessons ?? [],
		gloss: row.gloss,
		lemma: row.lemma,
		heb: row.heb,
		grk: row.grk,
		spa: row.spa,
		por: row.por,
		category: row.category,
		type: row.type,
		displayWord: getDisplayWord(row),
	}
}

async function getRelationSummaries(row: VocabEntryRow, kind: RelationKind) {
	const relationValues = getRelationValues(row, kind)
		.map((value) => Number(value))
		.filter((value) => Number.isInteger(value) && value > 0)

	if (!relationValues.length) {
		return []
	}

	const relatedRowsById = await db.query.vocabEntries.findMany({
		where: and(eq(vocabEntries.sourceKey, row.sourceKey), inArray(vocabEntries.id, relationValues)),
		orderBy: asc(vocabEntries.id),
	})

	const rowByRelationValue = new Map<number, VocabEntryRow>()
	for (const entry of relatedRowsById) {
		rowByRelationValue.set(entry.id, entry)
	}

	return relationValues
		.map((value) => rowByRelationValue.get(value))
		.filter((entry): entry is VocabEntryRow => Boolean(entry))
		.map((entry) => buildSummary(entry))
}

export const GET = async (req: Request) => {
	if (!(await isAdmin())) {
		return new NextResponse('Unauthorized', { status: 401 })
	}

	const { searchParams } = new URL(req.url)
	const sourceKey = searchParams.get('sourceKey')?.trim()
	const kind = (searchParams.get('kind')?.trim() ?? 'antonym') as RelationKind

	if (!sourceKey) {
		return new NextResponse('sourceKey is required', { status: 400 })
	}

	if (kind !== 'antonym' && kind !== 'synonym' && kind !== 'confused') {
		return new NextResponse('Invalid relation kind', { status: 400 })
	}

	const rowId = parsePositiveInt(searchParams.get('rowId'))
	if (rowId) {
		const row = await db.query.vocabEntries.findFirst({
			where: and(eq(vocabEntries.sourceKey, sourceKey), eq(vocabEntries.id, rowId)),
		})

		if (!row) {
			return new NextResponse('Vocab entry not found', { status: 404 })
		}

		return NextResponse.json({
			...buildSummary(row),
			relatedEntryIds: getRelationValues(row, kind),
			relatedEntries: await getRelationSummaries(row, kind),
		})
	}

	const q = searchParams.get('q')?.trim().toLowerCase() ?? ''
	if (!q) {
		return NextResponse.json([])
	}

	const limit = Math.min(parsePositiveInt(searchParams.get('limit')) ?? 10, 25)
	const rows = await db.query.vocabEntries.findMany({
		where: eq(vocabEntries.sourceKey, sourceKey),
		orderBy: asc(vocabEntries.id),
	})

	const matches = rows
		.filter((row) =>
			[
				row.id,
				row.gloss,
				row.lemma,
				row.heb,
				row.grk,
				row.spa,
				row.por,
				row.category,
				row.type,
				...(row.lessons ?? []),
			]
				.filter(Boolean)
				.some((value) => String(value).toLowerCase().includes(q))
		)
		.slice(0, limit)
		.map((row) => buildSummary(row))

	return NextResponse.json(matches)
}

export const POST = async (req: Request) => {
	if (!(await isAdmin())) {
		return new NextResponse('Unauthorized', { status: 401 })
	}

	const body = (await req.json()) as {
		sourceKey?: string
		leftId?: number
		rightId?: number
		kind?: RelationKind
	}

	const sourceKey = body.sourceKey?.trim()
	const leftId = typeof body.leftId === 'number' ? body.leftId : Number.NaN
	const rightId = typeof body.rightId === 'number' ? body.rightId : Number.NaN
	const kind = body.kind ?? 'antonym'

	if (!sourceKey) {
		return new NextResponse('sourceKey is required', { status: 400 })
	}

	if (kind !== 'antonym' && kind !== 'synonym' && kind !== 'confused') {
		return new NextResponse('Invalid relation kind', { status: 400 })
	}

	if (!Number.isInteger(leftId) || !Number.isInteger(rightId)) {
		return new NextResponse('Two vocab entries are required', { status: 400 })
	}

	if (leftId === rightId) {
		return new NextResponse('A vocab entry cannot be paired with itself', {
			status: 400,
		})
	}

	const [leftRow, rightRow] = await Promise.all([
		db.query.vocabEntries.findFirst({
			where: and(eq(vocabEntries.sourceKey, sourceKey), eq(vocabEntries.id, leftId)),
		}),
		db.query.vocabEntries.findFirst({
			where: and(eq(vocabEntries.sourceKey, sourceKey), eq(vocabEntries.id, rightId)),
		}),
	])

	if (!leftRow || !rightRow) {
		return new NextResponse('One or both vocab entries were not found', {
			status: 404,
		})
	}

	const leftRelationValues = Array.from(new Set([...getRelationValues(leftRow, kind), String(rightRow.id)]))
	const rightRelationValues = Array.from(new Set([...getRelationValues(rightRow, kind), String(leftRow.id)]))

	await db.transaction(async (tx) => {
		if (kind === 'synonym') {
			await tx
				.update(vocabEntries)
				.set({
					synonyms: leftRelationValues,
					payload: updatePayloadRelations(
						leftRow.payload,
						kind,
						leftRelationValues
					),
					updatedAt: new Date(),
				})
				.where(eq(vocabEntries.id, leftRow.id))

			await tx
				.update(vocabEntries)
				.set({
					synonyms: rightRelationValues,
					payload: updatePayloadRelations(
						rightRow.payload,
						kind,
						rightRelationValues
					),
					updatedAt: new Date(),
				})
				.where(eq(vocabEntries.id, rightRow.id))

			return
		}

		if (kind === 'confused') {
			await tx
				.update(vocabEntries)
				.set({
					confusedWith: leftRelationValues,
					payload: updatePayloadRelations(leftRow.payload, kind, leftRelationValues),
					updatedAt: new Date(),
				})
				.where(eq(vocabEntries.id, leftRow.id))

			await tx
				.update(vocabEntries)
				.set({
					confusedWith: rightRelationValues,
					payload: updatePayloadRelations(rightRow.payload, kind, rightRelationValues),
					updatedAt: new Date(),
				})
				.where(eq(vocabEntries.id, rightRow.id))

			return
		}

		await tx
			.update(vocabEntries)
			.set({
				antonyms: leftRelationValues,
				payload: updatePayloadRelations(leftRow.payload, kind, leftRelationValues),
				updatedAt: new Date(),
			})
			.where(eq(vocabEntries.id, leftRow.id))

		await tx
			.update(vocabEntries)
			.set({
				antonyms: rightRelationValues,
				payload: updatePayloadRelations(rightRow.payload, kind, rightRelationValues),
				updatedAt: new Date(),
			})
			.where(eq(vocabEntries.id, rightRow.id))
	})

	return NextResponse.json({
		ok: true,
		kind,
		leftEntry: buildSummary(leftRow),
		rightEntry: buildSummary(rightRow),
	})
}
