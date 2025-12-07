// app/[locale]/(app)/hebrew/alphabet/page.tsx

// import { getCurrentPublicCourses } from '@/db/queries/courses'
// import { authOptions } from '@/lib/auth'
// import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { hebrewLetters } from '@/lib/hebrew/hebrew-letters'
import { hebrewNiqqud } from '@/lib/hebrew/hebrew-niqqud'
import HebrewLetterQuiz from '@/components/hebrew/HebrewAlphabet'

interface PageProps {
	params: Promise<{ locale: string }>
}

export default async function Page({ params }: PageProps) {
	const { locale } = await params
	const t = await getTranslations({ locale, namespace: 'alphabet' })
	// const publicCurrent = await getCurrentPublicCourses()
	// const session = await getServerSession(authOptions)

	return (
		<div className="space-y-4">
			<h1 className="text-2xl font-bold">{t('title')}</h1>
			<HebrewLetterQuiz letters={hebrewLetters} niqqud={hebrewNiqqud} />
		</div>
	)
}
