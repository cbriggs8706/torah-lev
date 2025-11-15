import { NextResponse } from 'next/server'
import { courses } from '@/db/schema/tables/courses'
import { eq } from 'drizzle-orm'
import { supabaseDb } from '@/db'

export async function POST(req: Request) {
	const { code } = await req.json()

	if (!code) {
		return NextResponse.json({ error: 'Missing code' }, { status: 400 })
	}

	const course = await supabaseDb.query.courses.findFirst({
		where: eq(courses.courseCode, code),
	})

	if (!course) {
		return NextResponse.json({ error: 'Course not found' }, { status: 404 })
	}

	return NextResponse.json({ courseId: course.id })
}
