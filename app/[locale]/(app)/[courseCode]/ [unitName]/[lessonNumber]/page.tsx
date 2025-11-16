// app/[locale]/(app)/[courseCode]/[unitName]/[lessonNumber]/page.tsx
import { getServerSession } from 'next-auth'
import { notFound, redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { getTranslations } from 'next-intl/server'

interface CoursePageProps {
	params: Promise<{ locale: string; lessonNumber: string }>
}

export default async function Page({ params }: CoursePageProps) {
	const { locale, lessonNumber } = await params
	const t = await getTranslations({ locale, namespace: 'courses' })

	const session = await getServerSession(authOptions)
	const userRole = session?.user?.role ?? 'guest'

	return <div className="space-y-6"></div>
}
