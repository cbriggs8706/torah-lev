import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import db from '@/db/drizzle'
import { challenges } from '@/db/schema'
import { isAdmin } from '@/lib/admin'

// ✅ Helper to safely parse numeric IDs
const parseId = (idParam: string | undefined): number | null => {
	const id = Number(idParam)
	return Number.isNaN(id) ? null : id
}

// ✅ Shared handler for unauthorized
const unauthorized = () => new NextResponse('Unauthorized', { status: 403 })

// -------------------------
// 🔍 GET /api/challenges/[id]
// -------------------------
export const GET = async (
	req: Request,
	{ params }: { params: Promise<Record<string, string>> }
) => {
	if (!isAdmin()) return unauthorized()

	const id = parseId((await params).challengeId)
	if (!id) return new NextResponse('Invalid ID', { status: 400 })

	const data = await db.query.challenges.findFirst({
		where: eq(challenges.id, id),
	})

	if (!data) return new NextResponse('Not Found', { status: 404 })

	return NextResponse.json(data)
}

// -------------------------
// ✏️ PUT /api/challenges/[id]
// -------------------------
export const PUT = async (
	req: Request,
	{ params }: { params: Promise<Record<string, string>> }
) => {
	if (!isAdmin()) return unauthorized()

	const id = parseId((await params).challengeId)
	if (!id) return new NextResponse('Invalid ID', { status: 400 })

	let body
	try {
		body = await req.json()
	} catch {
		return new NextResponse('Invalid JSON', { status: 400 })
	}

	const data = await db
		.update(challenges)
		.set({ ...body })
		.where(eq(challenges.id, id))
		.returning()

	if (!data.length) return new NextResponse('Not Found', { status: 404 })

	return NextResponse.json(data[0])
}

// -------------------------
// 🗑 DELETE /api/challenges/[id]
// -------------------------
export const DELETE = async (
	req: Request,
	{ params }: { params: Promise<Record<string, string>> }
) => {
	if (!isAdmin()) return unauthorized()

	const id = parseId((await params).challengeId)
	if (!id) return new NextResponse('Invalid ID', { status: 400 })

	const data = await db
		.delete(challenges)
		.where(eq(challenges.id, id))
		.returning()

	if (!data.length) return new NextResponse('Not Found', { status: 404 })

	return NextResponse.json(data[0])
}
