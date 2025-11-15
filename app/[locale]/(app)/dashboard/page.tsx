// app/[locale]/(app)/dashboard/page.tsx

import { SignOutButton } from '@/components/auth/signout'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { TLButton } from '@/components/custom/tl-button'

import {
	CourseWithCount,
	getAllPublicCoursesWithEnrollment,
} from '@/db/queries/courses'
import { UserCoursesList } from '@/components/courses/CoursesList'
import UserDetails from '@/components/auth/user-details'

interface DashboardPageProps {
	params: Promise<{ locale: string }>
}

export default async function Page({ params }: DashboardPageProps) {
	const { locale } = await params
	const t = await getTranslations({ locale, namespace: 'common' })

	const session = await getServerSession(authOptions)
	const userId = session?.user.id
	if (!session) redirect(`/${locale}`)

	const role = session.user.role ?? 'user'

	// LOAD USER COURSES
	let userCourses: CourseWithCount[] = []
	if (role === 'user') {
		userCourses = await getAllPublicCoursesWithEnrollment(userId)
	}

	//TODO investigate why i have to logout and back in to see a refresh of this if the user changes their info in the UI
	console.log('session', session)
	// console.log('currentImage', session?.user?.image)
	// console.log('currentName', session?.user?.name)
	// console.log('currentUsername', session?.user?.username)
	return (
		<div className="space-y-6">
			<UserDetails
				currentImage={session?.user?.image}
				currentName={session?.user?.name}
				currentUsername={session?.user?.username}
			/>

			<h1 className="text-3xl font-bold">
				{role === 'admin' ? 'Admin Dashboard' : 'User Dashboard'}
			</h1>

			<p className="text-gray-600">Choose a course to begin learning.</p>

			{/* ADMIN ACTIONS */}
			{role === 'admin' && (
				<div className="flex gap-3">
					<Link href={`/${locale}/admin/course`}>
						<TLButton variant="outline">{t('viewCourses')}</TLButton>
					</Link>
					<Link href={`/${locale}/admin/course/create`}>
						<TLButton variant="outline">{t('createCourse')}</TLButton>
					</Link>
				</div>
			)}

			{/* USER COURSE LIST */}
			{role === 'user' && (
				<UserCoursesList courses={userCourses} locale={locale} />
			)}

			<SignOutButton />
		</div>
	)
}
