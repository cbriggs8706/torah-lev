import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import db from '@/db/drizzle'
import { lessons } from '@/db/schema'

export async function GET(
	_req: Request,
	{ params }: { params: { lessonId: string } }
) {
	try {
		const id = Number(params.lessonId)
		if (!id || isNaN(id)) {
			return NextResponse.json({ error: 'Invalid lesson ID' }, { status: 400 })
		}

		const data = await db.query.lessons.findFirst({
			where: eq(lessons.id, id),
		})

		if (!data) {
			return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
		}

		return NextResponse.json(data, { status: 200 })
	} catch (err) {
		console.error('Error fetching single lesson:', err)
		return NextResponse.json(
			{ error: 'Failed to fetch lesson' },
			{ status: 500 }
		)
	}
}
