import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import db from '@/db/drizzle'
import { courses } from '@/db/schema'
import { isAdmin } from '@/lib/admin'

// 🔧 Helper to safely parse ID from route params
const parseId = (idParam: string | undefined): number | null => {
	const id = Number(idParam)
	return Number.isNaN(id) ? null : id
}

const unauthorized = () => new NextResponse('Unauthorized', { status: 403 })

// --------------------
// 🔍 GET /api/courses/[courseId]
// --------------------
export const GET = async (
	_req: Request,
	{ params }: { params: Record<string, string> }
) => {
	if (!isAdmin()) return unauthorized()

	const id = parseId(params.courseId)
	if (!id) return new NextResponse('Invalid course ID', { status: 400 })

	const data = await db.query.courses.findFirst({
		where: eq(courses.id, id),
	})

	if (!data) return new NextResponse('Course not found', { status: 404 })

	return NextResponse.json(data)
}

// --------------------
// ✏️ PUT /api/courses/[courseId]
// --------------------
export const PUT = async (
	req: Request,
	{ params }: { params: Record<string, string> }
) => {
	if (!isAdmin()) return unauthorized()

	const id = parseId(params.courseId)
	if (!id) return new NextResponse('Invalid course ID', { status: 400 })

	let body
	try {
		body = await req.json()
	} catch {
		return new NextResponse('Invalid JSON', { status: 400 })
	}

	const data = await db
		.update(courses)
		.set({ ...body })
		.where(eq(courses.id, id))
		.returning()

	if (!data.length) return new NextResponse('Course not found', { status: 404 })

	return NextResponse.json(data[0])
}

// --------------------
// 🗑 DELETE /api/courses/[courseId]
// --------------------
export const DELETE = async (
	_req: Request,
	{ params }: { params: Record<string, string> }
) => {
	if (!isAdmin()) return unauthorized()

	const id = parseId(params.courseId)
	if (!id) return new NextResponse('Invalid course ID', { status: 400 })

	const data = await db.delete(courses).where(eq(courses.id, id)).returning()

	if (!data.length) return new NextResponse('Course not found', { status: 404 })

	return NextResponse.json(data[0])
}
