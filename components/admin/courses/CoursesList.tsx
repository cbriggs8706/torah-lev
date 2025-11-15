// components/admin/courses/OrganizerCoursesList.tsx
'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Pencil, Trash2, MapPin, Video, Users } from 'lucide-react'

import type { CourseWithEnrollments } from '@/db/queries/courses'

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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

type Props = {
	courses: CourseWithEnrollments[]
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
				const enrolled = course.enrolledCount ?? 0
				const max = course.maxEnrollment ?? null
				const isFull = max !== null && enrolled >= max
				const spotsLeft = max !== null ? max - enrolled : null

				return (
					<Card
						key={course.id}
						onClick={() => router.push(`/${locale}/${course.courseCode}`)}
						className="cursor-pointer hover:bg-accent transition flex flex-col"
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
									href={`/${locale}/${course.courseCode}/update`}
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
										Max Enrollment: {course.maxEnrollment}
										{isFull ? (
											<span className="text-red-600 font-semibold">
												{' '}
												— FULL —{' '}
											</span>
										) : (
											<span className="text-green-600">
												{' '}
												— {spotsLeft} Available —{' '}
											</span>
										)}
										<span className="text-muted-foreground">
											Registration {course.enrollmentOpen ? 'Open' : 'Closed'}
										</span>
									</p>
								)}
								{course.enrollments && course.enrollments.length > 0 && (
									<div className="*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2 mt-3">
										{course.enrollments.slice(0, 5).map((e) => (
											<Avatar
												key={e.student.id}
												data-slot="avatar"
												className="h-8 w-8"
											>
												<AvatarImage
													src={e.student.image || '/default-avatar.png'}
													alt={e.student.name || 'Student'}
												/>
												<AvatarFallback>
													{(e.student.name || 'U').charAt(0).toUpperCase()}
												</AvatarFallback>
											</Avatar>
										))}

										{/* +X overflow count */}
										{course.enrollments.length > 5 && (
											<div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-xs font-semibold ring-2 ring-background">
												+{course.enrollments.length - 5}
											</div>
										)}
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				)
			})}
		</div>
	)
}
