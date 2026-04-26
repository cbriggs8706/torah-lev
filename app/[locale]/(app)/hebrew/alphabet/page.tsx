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
			<section className="tl-papyrus-scroll px-1 py-4">
				<div className="tl-papyrus-sheet px-5 py-7 md:px-8 md:py-8">
					<div className="tl-vellum-panel rounded-[2rem] px-6 py-6 md:px-8 md:py-7">
						<p className="font-nunito text-[1.35rem] leading-none text-[#6f5546] md:text-[1.5rem]">
							Alphabet
						</p>
						<h1 className="font-cardo mt-3 text-4xl font-semibold text-[#2f1b12] md:text-5xl">
							{t('title')}
						</h1>
					</div>
				</div>
			</section>
			<section className="tl-panel rounded-[2rem] p-4 md:p-6">
				<HebrewLetterQuiz letters={hebrewLetters} niqqud={hebrewNiqqud} />
			</section>
		</div>
	)
}
