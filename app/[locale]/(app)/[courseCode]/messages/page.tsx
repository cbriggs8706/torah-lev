import Image from 'next/image'
import { notFound, redirect } from 'next/navigation'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import CourseThreadsWorkspace from '@/components/courses/CourseThreadsWorkspace'
import { getCourseByCode } from '@/db/queries/courses'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canAccessPrivateCourse, getCourseAccessByCode } from '@/lib/courses/access'

interface PageProps {
	params: Promise<{ locale: string; courseCode: string }>
}

export default async function MessageboardPage({ params }: PageProps) {
	const { locale, courseCode } = await params
	const course = await getCourseByCode(courseCode)
	if (!course) return notFound()

	const session = await getServerSession(authOptions)
	const userRole = session?.user?.role ?? 'guest'
	const access = await getCourseAccessByCode(courseCode, session?.user?.id)

	if (!canAccessPrivateCourse(access, userRole)) {
		return redirect(`/${locale}/register`)
	}

	return (
		<div className="space-y-4 px-6">
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
			</div>
			<CourseThreadsWorkspace
				courseId={course.id}
				currentUserId={session?.user?.id ?? ''}
			/>
		</div>
	)
}
