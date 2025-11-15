// components/courses/CurrentPublicCoursesList.tsx
'use client'

import { CourseCard } from './CourseCard'
import { CourseWithCount } from '@/db/queries/courses'

export function CurrentPublicCoursesList({
	courses,
}: {
	courses: CourseWithCount[]
}) {
	if (!courses.length)
		return <p className="text-muted-foreground">No public courses available.</p>

	return (
		<div className="grid gap-4">
			{courses.map((course) => (
				<CourseCard key={course.id} course={course} />
			))}
		</div>
	)
}
