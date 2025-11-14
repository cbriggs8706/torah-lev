// components/admin/courses/OrganizerCoursesList.tsx
'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Pencil, Trash2, MapPin, Video, Users } from 'lucide-react'

import type { Course } from '@/db/queries/courses'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AspectRatio } from '@/components/ui/aspect-ratio'

import {
	AlertDialog,
	AlertDialogTrigger,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogCancel,
	AlertDialogAction,
} from '@/components/ui/alert-dialog'

type Props = {
	courses: Course[]
	locale: string
}

export function OrganizerCoursesList({ courses, locale }: Props) {
	const router = useRouter()

	async function deleteCourse(id: string) {
		const res = await fetch(`/api/courses/${id}`, { method: 'DELETE' })
		if (!res.ok) {
			alert('Failed to delete course')
			return
		}
		router.refresh()
	}

	if (!courses.length) {
		return (
			<p className="text-muted-foreground">
				You haven&apos;t created any courses yet.
			</p>
		)
	}

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{courses.map((course) => {
				const hasImage = !!course.imageSrc

				return (
					<Card
						key={course.id}
						className="cursor-pointer hover:bg-accent transition flex flex-col"
						onClick={() =>
							router.push(`/${locale}/admin/course/read/${course.id}`)
						}
					>
						{/* IMAGE — Only renders if available */}
						{course.imageSrc && (
							<div className="p-4 pb-0">
								<AspectRatio ratio={16 / 9}>
									<Image
										src={course.imageSrc}
										alt={course.slug}
										fill
										className="rounded-md object-cover"
										sizes="(max-width: 768px) 100vw,
											   (max-width: 1200px) 50vw,
											   33vw"
									/>
								</AspectRatio>
							</div>
						)}

						{/* HEADER */}
						<CardHeader
							className={`flex flex-row justify-between items-start gap-2 ${
								hasImage ? 'pt-2' : 'pt-4'
							}`}
						>
							<div className="flex-1">
								<CardTitle className="text-lg mb-1">{course.slug}</CardTitle>

								<div className="flex flex-wrap gap-2 mb-1">
									<Badge variant="secondary">{course.courseCode}</Badge>
									<Badge>{course.type}</Badge>
									{course.current && <Badge variant="outline">Active</Badge>}
									{course.public ? (
										<Badge variant="default">Public</Badge>
									) : (
										<Badge variant="destructive">Private</Badge>
									)}
								</div>

								{/* Levels */}
								<div className="text-xs text-muted-foreground">
									Level {course.startProficiencyLevel} →{' '}
									{course.endProficiencyLevel}
								</div>

								{/* Dates */}
								{course.startDate && course.endDate && (
									<div className="text-xs text-muted-foreground mt-1">
										{new Date(course.startDate).toLocaleDateString()}→{' '}
										{new Date(course.endDate).toLocaleDateString()}
									</div>
								)}
							</div>

							{/* ACTION BUTTONS */}
							<div className="flex items-start gap-1">
								{/* UPDATE */}
								<Link
									href={`/${locale}/admin/course/update/${course.id}`}
									onClick={(e) => e.stopPropagation()}
								>
									<Button variant="ghost" size="icon">
										<Pencil className="h-4 w-4" />
									</Button>
								</Link>

								{/* DELETE */}
								<AlertDialog>
									<AlertDialogTrigger asChild>
										<Button
											variant="ghost"
											size="icon"
											onClick={(e) => e.stopPropagation()}
										>
											<Trash2 className="h-4 w-4 text-red-500" />
										</Button>
									</AlertDialogTrigger>

									<AlertDialogContent>
										<AlertDialogHeader>
											<AlertDialogTitle>
												Delete “{course.slug}”?
											</AlertDialogTitle>
											<AlertDialogDescription>
												This action cannot be undone.
											</AlertDialogDescription>
										</AlertDialogHeader>
										<AlertDialogFooter>
											<AlertDialogCancel onClick={(e) => e.stopPropagation()}>
												Cancel
											</AlertDialogCancel>
											<AlertDialogAction
												className="bg-red-600 hover:bg-red-700"
												onClick={(e) => {
													e.stopPropagation()
													deleteCourse(course.id)
												}}
											>
												Delete
											</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							</div>
						</CardHeader>

						{/* CONTENT */}
						<CardContent className="flex-1">
							<p className="text-sm text-muted-foreground mb-3">
								{course.description || 'No description provided'}
							</p>

							<div className="space-y-1 text-xs">
								{/* Location */}
								{course.location && (
									<p className="flex items-center gap-1">
										<MapPin className="h-3 w-3" />
										{course.location}
									</p>
								)}

								{/* Zoom */}
								{course.zoomLink && (
									<p className="flex items-center gap-1">
										<Video className="h-3 w-3" />
										<span className="truncate">{course.zoomLink}</span>
									</p>
								)}

								{/* Enrollment */}
								{course.maxEnrollment && (
									<p className="flex items-center gap-1">
										<Users className="h-3 w-3" />
										Max Enrollment: {course.maxEnrollment}{' '}
										{course.enrollmentOpen ? '(Open)' : '(Closed)'}
									</p>
								)}
							</div>
						</CardContent>
					</Card>
				)
			})}
		</div>
	)
}
