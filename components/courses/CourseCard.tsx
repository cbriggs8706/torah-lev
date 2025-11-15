// components/courses/CourseCard.tsx

'use client'

import Image from 'next/image'
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
	CardFooter,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CourseWithCount } from '@/db/queries/courses'
import Link from 'next/link'

export function CourseCard({ course }: { course: CourseWithCount }) {
	const router = useRouter()
	const params = useParams()
	const locale = params?.locale as string // dynamic locale segment

	async function handleEnroll(e: React.MouseEvent) {
		e.stopPropagation() // ⛔ prevents click-through navigation
		const res = await fetch(`/api/courses/${course.id}/enroll`, {
			method: 'POST',
		})
		if (!res.ok) return toast.error('Enrollment failed.')
		toast.success(`Enrolled in ${course.slug}`)
		router.refresh()
	}

	async function handleUnenroll(e: React.MouseEvent) {
		e.stopPropagation()
		const res = await fetch(`/api/courses/${course.id}/unenroll`, {
			method: 'POST',
		})
		if (!res.ok) return toast.error('Could not unenroll.')
		toast.success(`Unenrolled from ${course.slug}`)
		router.refresh()
	}

	const enrolled = course.enrolledCount ?? 0
	const max = course.maxEnrollment ?? null
	const isFull = max !== null && enrolled >= max
	const spotsLeft = max !== null ? max - enrolled : null

	return (
		<Link href={`/${locale}/${course.courseCode}`} className="block">
			<Card className="overflow-hidden">
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
							<Badge className="bg-blue-600 text-white">Enrolled</Badge>
						) : isFull ? (
							<Badge variant="destructive">Full</Badge>
						) : (
							<Badge variant="secondary">
								{spotsLeft ? `${spotsLeft} spots left` : 'Class is full'}
							</Badge>
						)}
					</CardTitle>

					<p className="text-sm text-muted-foreground">
						{course.organizerGroupName}
					</p>

					{course.organizer?.name && (
						<div className="flex items-center gap-3 mt-1">
							<Avatar className="h-14 w-14">
								<AvatarImage src={course.organizer.image || undefined} />
								<AvatarFallback>
									{course.organizer.name[0].toUpperCase()}
								</AvatarFallback>
							</Avatar>

							<div className="flex flex-col">
								<span className="text-xs text-muted-foreground">
									Instructor
								</span>
								<span className="font-medium text-base">
									{course.organizer.name}
								</span>
							</div>
						</div>
					)}

					<p className="text-sm text-muted-foreground">{course.courseCode}</p>
				</CardHeader>

				<CardContent>
					<p className="text-sm text-muted-foreground">
						{course.description || 'No description'}
					</p>
				</CardContent>

				<CardFooter>
					{course.isEnrolled ? (
						<Button className="w-full bg-red-600" onClick={handleUnenroll}>
							Unenroll
						</Button>
					) : (
						<Button className="w-full" disabled={isFull} onClick={handleEnroll}>
							{isFull ? 'Full' : 'Enroll'}
						</Button>
					)}
				</CardFooter>
			</Card>
		</Link>
	)
}
