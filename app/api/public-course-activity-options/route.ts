import { NextResponse } from 'next/server'

import { isAdmin } from '@/lib/admin'
import { getPublicCourseActivityFilterOptions } from '@/lib/server/public-course-activity-options'

export async function GET(request: Request) {
	if (!(await isAdmin())) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const { searchParams } = new URL(request.url)
	const platformCourseId = Number(searchParams.get('platformCourseId'))

	if (!Number.isFinite(platformCourseId) || platformCourseId <= 0) {
		return NextResponse.json(
			{ error: 'A valid platformCourseId is required.' },
			{ status: 400 }
		)
	}

	const options = await getPublicCourseActivityFilterOptions(platformCourseId)
	return NextResponse.json(options)
}
