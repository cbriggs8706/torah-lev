import { NextResponse } from 'next/server'
import { asc, eq } from 'drizzle-orm'
import db from '@/db/drizzle'
import { constructAbsoluteWords, lessons } from '@/db/schema'
import { isAdmin } from '@/lib/admin'
import { toConstructAbsoluteAdminRecord } from '@/lib/construct-absolute'

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
	const row = {
		lessonId: normalizeOptionalNumber(body.lessonId) ?? 1,
		absolute: normalizeNullableString(body.absolute) ?? '',
		construct: normalizeNullableString(body.construct) ?? '',
	}

	return {
		...row,
		payload: row,
		updatedAt: new Date(),
	}
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

	const baseRows = await db.query.constructAbsoluteWords.findMany({
		with: {
			lesson: {
				with: {
					unit: {
						with: {
							course: true,
						},
					},
				},
			},
		},
		orderBy: asc(constructAbsoluteWords.id),
	})

	let rows = baseRows.map((row) =>
		toConstructAbsoluteAdminRecord({
			...row,
			lessonNumber: row.lesson?.lessonNumber ?? null,
			lessonTitle: row.lesson?.title ?? null,
			lessonLabel: row.lesson
				? `${row.lesson.unit?.course?.title ?? 'Course'} > ${
						row.lesson.unit?.title ?? 'Unit'
				  } > ${row.lesson.lessonNumber || row.lesson.order} - ${row.lesson.title}`
				: null,
		})
	)

	if (Array.isArray(filter.id) && filter.id.length > 0) {
		const idSet = new Set(filter.id.map((value) => Number(value)))
		rows = rows.filter((row) => idSet.has(row.id))
	}

	if (typeof filter.q === 'string' && filter.q.trim()) {
		const query = filter.q.trim().toLowerCase()
		rows = rows.filter((row) =>
			[
				row.absolute,
				row.construct,
				row.lessonTitle,
				row.lessonNumber,
				row.lessonLabel,
			]
				.filter(Boolean)
				.some((value) => String(value).toLowerCase().includes(query))
		)
	}

	if (filter.lessonId !== undefined && filter.lessonId !== '') {
		const lessonId = Number(filter.lessonId)
		if (Number.isFinite(lessonId)) {
			rows = rows.filter((row) => row.lessonId === lessonId)
		}
	}

	const [sortField, sortOrder] = sort
	const direction = sortOrder?.toUpperCase() === 'DESC' ? -1 : 1

	rows.sort((a, b) => {
		const left =
			sortField === 'lessonSort'
				? a.lessonSort
				: (a as Record<string, unknown>)[sortField] ?? ''
		const right =
			sortField === 'lessonSort'
				? b.lessonSort
				: (b as Record<string, unknown>)[sortField] ?? ''

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

	const raw = (await req.json()) as Record<string, unknown>
	const body = (raw.data as Record<string, unknown>) ?? raw
	const normalized = normalizeRecord(body)

	const data = await db
		.insert(constructAbsoluteWords)
		.values({
			...normalized,
			createdAt: new Date(),
		})
		.returning()

	const lesson = await db.query.lessons.findFirst({
		where: eq(lessons.id, data[0].lessonId),
		with: {
			unit: {
				with: {
					course: true,
				},
			},
		},
	})

	return NextResponse.json(
		toConstructAbsoluteAdminRecord({
			...data[0],
			lessonNumber: lesson?.lessonNumber ?? null,
			lessonTitle: lesson?.title ?? null,
			lessonLabel: lesson
				? `${lesson.unit?.course?.title ?? 'Course'} > ${
						lesson.unit?.title ?? 'Unit'
				  } > ${lesson.lessonNumber || lesson.order} - ${lesson.title}`
				: null,
		})
	)
}
