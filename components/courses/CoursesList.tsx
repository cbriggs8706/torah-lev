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
import { toast } from 'sonner'
import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'

type Props = {
	courses: CourseWithCount[]
	locale: string
}

export function UserCoursesList({ courses }: Props) {
	const router = useRouter()
	const [enrolledCourses, setEnrolledCourses] = useState<Set<string>>(new Set())

	async function handleEnroll(courseId: string, slug: string) {
		const res = await fetch(`/api/courses/${courseId}/enroll`, {
			method: 'POST',
		})

		if (!res.ok) {
			toast.error('Enrollment failed. Please try again.')
			return
		}

		setEnrolledCourses(new Set([...enrolledCourses, courseId]))

		toast.success(`You are now enrolled in ${slug}!`)

		router.refresh()
	}

	if (!courses.length) {
		return <p className="text-muted-foreground">No available courses.</p>
	}

	async function handleUnenroll(courseId: string, slug: string) {
		const res = await fetch(`/api/courses/${courseId}/unenroll`, {
			method: 'POST',
		})

		if (!res.ok) {
			toast.error(`Could not unenroll from ${slug}`)
			return
		}

		toast.success(`Unenrolled from ${slug}`)
		router.refresh()
	}

	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

								{course.isEnrolled ? (
									<Badge variant="default" className="bg-blue-600 text-white">
										Enrolled
									</Badge>
								) : isFull ? (
									<Badge variant="destructive">Full</Badge>
								) : (
									<Badge variant="secondary">
										{spotsLeft! > 0
											? `${spotsLeft} spots left`
											: 'Class is full'}
									</Badge>
								)}
							</CardTitle>

							<p className="text-sm text-muted-foreground">
								{course.organizerGroupName}
							</p>
							{/* Instructor */}
							{course.organizer?.name && (
								<div className="flex items-center gap-3 mt-1 text-sm">
									<Avatar className="h-14 w-14">
										<AvatarImage src={course.organizer.image || undefined} />
										<AvatarFallback className="text-lg">
											{course.organizer.name.charAt(0).toUpperCase()}
										</AvatarFallback>
									</Avatar>

									<div className="flex flex-col leading-tight">
										<span className="text-xs text-muted-foreground">
											Instructor
										</span>
										<span className="font-medium text-foreground text-base">
											{course.organizer.name}
										</span>
									</div>
								</div>
							)}

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
						</CardContent>

						<CardFooter className="flex gap-2">
							{!course.isEnrolled ? (
								<Button
									className="w-full"
									disabled={!course.enrollmentOpen || isFull}
									onClick={() => handleEnroll(course.id, course.slug)}
								>
									{isFull ? 'Class Full' : 'Enroll'}
								</Button>
							) : (
								<Button
									className="w-full bg-red-600 hover:bg-red-700"
									onClick={() => handleUnenroll(course.id, course.slug)}
								>
									Unenroll
								</Button>
							)}
						</CardFooter>
					</Card>
				)
			})}
		</div>
	)
}
