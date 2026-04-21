// app/[locale]/(app)/hebrew/alphabet/page.tsx

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

	return (
		<div className="space-y-6">
			<section className="tl-panel rounded-[2rem] p-6 md:p-8">
				<p className="tl-kicker">Alphabet sanctuary</p>
				<h1 className="tl-heading mt-3 text-4xl font-semibold md:text-5xl">
					{t('title')}
				</h1>
			</section>
			<section className="tl-panel rounded-[2rem] p-4 md:p-6">
				<HebrewLetterQuiz letters={hebrewLetters} niqqud={hebrewNiqqud} />
			</section>
		</div>
	)
}
