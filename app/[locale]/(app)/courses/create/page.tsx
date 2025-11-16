// app/[locale]/(app)/courses/create/page.tsx
import { CourseForm } from '@/components/courses/CourseForm'
import { authOptions } from '@/lib/auth'
import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'

export default async function Page({
	params,
}: {
	params: Promise<{ locale: string }>
}) {
	const { locale } = await params
	const t = await getTranslations({ locale, namespace: 'courses' })
	const session = await getServerSession(authOptions)

	if (!session || !session.user) redirect(`/${locale}/login`)

	return (
		<div className="p-6 space-y-2">
			{/* ✅ Strings only */}
			<h1 className="text-2xl font-bold mb-4">
				{t('create')}
				{t('singular')}
			</h1>

			<CourseForm />
		</div>
	)
}
