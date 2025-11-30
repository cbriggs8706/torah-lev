// db/queries/messages.ts

import { supabaseDb as db } from '@/db/client'
import { courses } from '@/db/schema/tables/courses'
import { eq, asc } from 'drizzle-orm'
import { messages } from '@/db/schema/tables/messages'

export async function getCourseWithMessages(courseCode: string) {
	const course = await db.query.courses.findFirst({
		where: eq(courses.courseCode, courseCode),
		with: {
			// teacher: true,
			enrollments: { with: { student: true } },
			messages: {
				with: { sender: true },
				orderBy: [asc(messages.createdAt)],
			},
		},
	})

	if (!course) return null

	return course
}
