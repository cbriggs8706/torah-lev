// components/courses/CoursesList.tsx
'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
	CardFooter,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { CourseWithCount } from '@/db/queries/courses'

type Props = {
	courses: CourseWithCount[]
	locale: string
}

export function UserCoursesList({ courses, locale }: Props) {
	const router = useRouter()

	async function handleEnroll(courseId: string) {
		const res = await fetch(`/api/courses/${courseId}/enroll`, {
			method: 'POST',
		})

		if (!res.ok) {
			alert('Failed to enroll')
			return
		}

		router.refresh()
	}

	if (!courses.length) {
		return <p className="text-muted-foreground">No available courses.</p>
	}

	return (
		<div className="grid gap-4">
			{courses.map((course) => {
				const enrolled = course.enrolledCount ?? 0
				const max = course.maxEnrollment ?? null
				const isFull = max !== null && enrolled >= max
				const spotsLeft = max !== null ? max - enrolled : null

				return (
					<Card key={course.id} className="overflow-hidden">
						{/* Image */}
						{course.imageSrc && (
							<div className="relative h-40 w-full">
								<Image
									src={course.imageSrc}
									fill
									alt={course.slug}
									className="object-cover"
								/>
							</div>
						)}

						<CardHeader>
							<CardTitle className="flex justify-between items-center">
								<span>{course.slug}</span>
								{isFull ? (
									<Badge variant="destructive">Full</Badge>
								) : (
									<Badge variant="secondary">Open</Badge>
								)}
							</CardTitle>

							<p className="text-sm text-muted-foreground">
								{course.organizerGroupName}
							</p>
							<p className="text-sm text-muted-foreground">
								{course.courseCode}
							</p>

							{course.startDate && (
								<p className="text-xs text-muted-foreground">
									Starts:{' '}
									{new Date(course.startDate).toISOString().split('T')[0]}
								</p>
							)}

							{course.endDate && (
								<p className="text-xs text-muted-foreground">
									Ends: {new Date(course.endDate).toISOString().split('T')[0]}
								</p>
							)}
						</CardHeader>

						<CardContent>
							<p className="text-sm text-muted-foreground mb-2">
								{course.description || 'No description'}
							</p>

							{/* Spots */}
							{max && (
								<p className="text-xs text-muted-foreground">
									{spotsLeft! > 0 ? `${spotsLeft} spots left` : 'Class is full'}
								</p>
							)}
						</CardContent>

						<CardFooter>
							<Button
								className="w-full"
								disabled={!course.enrollmentOpen || isFull}
								onClick={() => handleEnroll(course.id)}
							>
								{isFull
									? 'Class Full'
									: course.enrollmentOpen
									? 'Enroll'
									: 'Enrollment Closed'}
							</Button>
						</CardFooter>
					</Card>
				)
			})}
		</div>
	)
}
