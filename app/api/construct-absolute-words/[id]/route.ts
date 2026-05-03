import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import db from '@/db/drizzle'
import { constructAbsoluteWords, lessons } from '@/db/schema'
import { isAdmin } from '@/lib/admin'
import { toConstructAbsoluteAdminRecord } from '@/lib/construct-absolute'

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

function parseId(id: string) {
	const parsed = Number(id)
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

async function withLesson(record: typeof constructAbsoluteWords.$inferSelect) {
	const lesson = await db.query.lessons.findFirst({
		where: eq(lessons.id, record.lessonId),
		with: {
			unit: {
				with: {
					course: true,
				},
			},
		},
	})

	return toConstructAbsoluteAdminRecord({
		...record,
		lessonNumber: lesson?.lessonNumber ?? null,
		lessonTitle: lesson?.title ?? null,
		lessonLabel: lesson
			? `${lesson.unit?.course?.title ?? 'Course'} > ${
					lesson.unit?.title ?? 'Unit'
			  } > ${lesson.lessonNumber || lesson.order} - ${lesson.title}`
			: null,
	})
}

export const GET = async (_req: Request, { params }: Params) => {
	if (!(await isAdmin())) {
		return new NextResponse('Unauthorized', { status: 403 })
	}

	const id = parseId((await params).id)
	if (!id) return new NextResponse('Invalid ID', { status: 400 })

	const data = await db.query.constructAbsoluteWords.findFirst({
		where: eq(constructAbsoluteWords.id, id),
	})

	if (!data) return new NextResponse('Not Found', { status: 404 })
	return NextResponse.json(await withLesson(data))
}

export const PUT = async (req: Request, { params }: Params) => {
	if (!(await isAdmin())) {
		return new NextResponse('Unauthorized', { status: 403 })
	}

	const id = parseId((await params).id)
	if (!id) return new NextResponse('Invalid ID', { status: 400 })

	const raw = (await req.json()) as Record<string, unknown>
	const body = (raw.data as Record<string, unknown>) ?? raw
	const normalized = normalizeRecord(body)

	const data = await db
		.update(constructAbsoluteWords)
		.set(normalized)
		.where(eq(constructAbsoluteWords.id, id))
		.returning()

	if (!data.length) return new NextResponse('Not Found', { status: 404 })
	return NextResponse.json(await withLesson(data[0]))
}

export const DELETE = async (_req: Request, { params }: Params) => {
	if (!(await isAdmin())) {
		return new NextResponse('Unauthorized', { status: 403 })
	}

	const id = parseId((await params).id)
	if (!id) return new NextResponse('Invalid ID', { status: 400 })

	const data = await db
		.delete(constructAbsoluteWords)
		.where(eq(constructAbsoluteWords.id, id))
		.returning()

	if (!data.length) return new NextResponse('Not Found', { status: 404 })
	return NextResponse.json(await withLesson(data[0]))
}
