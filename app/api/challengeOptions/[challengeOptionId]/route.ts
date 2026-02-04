import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import db from '@/db/drizzle'
import { challengeOptions } from '@/db/schema'
import { isAdmin } from '@/lib/admin'

// ✅ Type utility
type Params = { params: Promise<{ challengeOptionId: string }> }

// ✅ Helper
const parseId = (id: string): number | null => {
	const n = Number(id)
	return Number.isNaN(n) ? null : n
}

// -------------------------------
// 🔍 GET: Fetch one challengeOption
// -------------------------------
export const GET = async (req: Request, { params }: Params) => {
	if (!isAdmin()) {
		return new NextResponse('Unauthorized', { status: 403 })
	}

	const id = parseId((await params).challengeOptionId)
	if (!id) {
		return new NextResponse('Invalid ID', { status: 400 })
	}

	const data = await db.query.challengeOptions.findFirst({
		where: eq(challengeOptions.id, id),
	})

	if (!data) {
		return new NextResponse('Not Found', { status: 404 })
	}

	return NextResponse.json(data)
}

// -------------------------------
// ✏️ PUT: Update challengeOption
// -------------------------------
export const PUT = async (req: Request, { params }: Params) => {
	if (!isAdmin()) {
		return new NextResponse('Unauthorized', { status: 403 })
	}

	const id = parseId((await params).challengeOptionId)
	if (!id) {
		return new NextResponse('Invalid ID', { status: 400 })
	}

	const body = await req.json()

	const data = await db
		.update(challengeOptions)
		.set({ ...body })
		.where(eq(challengeOptions.id, id))
		.returning()

	if (!data.length) {
		return new NextResponse('Not Found', { status: 404 })
	}

	return NextResponse.json(data[0])
}

// -------------------------------
// 🗑 DELETE: Remove challengeOption
// -------------------------------
export const DELETE = async (req: Request, { params }: Params) => {
	if (!isAdmin()) {
		return new NextResponse('Unauthorized', { status: 403 })
	}

	const id = parseId((await params).challengeOptionId)
	if (!id) {
		return new NextResponse('Invalid ID', { status: 400 })
	}

	const data = await db
		.delete(challengeOptions)
		.where(eq(challengeOptions.id, id))
		.returning()

	if (!data.length) {
		return new NextResponse('Not Found', { status: 404 })
	}

	return NextResponse.json(data[0])
}
