'use client'

import { CourseCard } from './CourseCard'
import { CourseWithCount } from '@/db/queries/courses'

export function EnrolledCourses({ courses }: { courses: CourseWithCount[] }) {
	if (!courses.length)
		return (
			<p className="text-muted-foreground">
				You are not enrolled in any courses.
			</p>
		)

	return (
		<div className="grid gap-4">
			{courses.map((course) => (
				<CourseCard key={course.id} course={course} />
			))}
		</div>
	)
}
