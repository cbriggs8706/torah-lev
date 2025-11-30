import Image from 'next/image'
import { notFound, redirect } from 'next/navigation'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import CourseMessages from '@/components/courses/Messages'
import { getCourseWithMessages } from '@/db/queries/messages'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface PageProps {
	params: Promise<{ locale: string; courseCode: string }>
}

export default async function MessageboardPage({ params }: PageProps) {
	const { locale, courseCode } = await params
	console.log('courseCode', courseCode)
	const course = await getCourseWithMessages(courseCode)
	if (!course) return notFound()

	const session = await getServerSession(authOptions)
	const userRole = session?.user?.role ?? 'guest'

	if (!course.public && !['admin', 'user'].includes(userRole)) {
		return redirect(`/${locale}/register`)
	}
	console.log('DEBUG: courseCode', courseCode)
	console.log('DEBUG: course', course)

	if (!course) {
		return (
			<p className="text-center mt-10 text-gray-500">
				This course could not be found.
			</p>
		)
	}

	return (
		<div className="flex flex-row-reverse gap-12 px-6">
			<div className="w-full flex flex-col items-center">
				<Image
					src="/left-speech-bubble-svgrepo-com.svg"
					alt="Messageboard"
					height={90}
					width={90}
				/>
				<h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
					{course.slug} Messageboard
				</h1>
				<Link href={`/${locale}/${course.courseCode}`}>
					<Button size="sm" className="mb-4">
						Back to Dashboard
					</Button>
				</Link>
				<CourseMessages
					currentUserId={session!.user.id}
					// instructor={{
					// 	id: course.teacher.userId,
					// 	name: course.teacher.userName,
					// 	avatar: course.teacher.userImageSrc,
					// 	isInstructor: true,
					// }}
					members={course.enrollments.map((m) => ({
						id: m.student.id,
						name: m.student.name!,
						avatar: m.student.image,
					}))}
					messages={course.messages.map((msg) => ({
						id: msg.id,
						senderId: msg.senderId,
						content: msg.content,
						createdAt: msg.createdAt!,
					}))}
					courseCode={course.courseCode}
				/>
			</div>
		</div>
	)
}
