// app/api/study-groups/[id]/lessons/route.ts
import { NextResponse } from 'next/server'
import db from '@/db/drizzle'
import { lessons, studyGroups, units } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'

export async function GET(req: Request, { params }: any) {
	try {
		const groupId = Number(params.id)

		// Example: lessons linked by shared course or units within same course
		const group = await db.query.studyGroups.findFirst({
			where: eq(studyGroups.id, groupId),
			with: {
				teacher: true,
			},
		})
		if (!group) {
			return NextResponse.json([], { status: 200 })
		}

		// Fetch all lessons from that teacher’s active course
		const allLessons = await db.query.lessons.findMany({
			orderBy: (l, { asc }) => [asc(l.order)],
			with: {
				unit: true,
			},
		})

		// Return flat array
		return NextResponse.json(allLessons)
	} catch (err) {
		console.error('❌ Error fetching lessons for study group:', err)
		return NextResponse.json([], { status: 500 })
	}
}
