// app/api/guest-course/route.ts
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
	const { courseId } = await req.json()

	if (!courseId) {
		return NextResponse.json({ error: 'Missing courseId' }, { status: 400 })
	}

	const res = NextResponse.json({ success: true })
	res.cookies.set('guestActiveCourseId', String(courseId), {
		path: '/',
		maxAge: 60 * 60 * 24 * 365,
	})
	return res
}
