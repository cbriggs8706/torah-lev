// app/[locale]/(app)/reader/hebrew/[bookName]/dictionary/page.tsx

import { notFound } from 'next/navigation'
import HebrewDictionary from '@/components/hebrew/HebrewDictionary'
import {
	getBookId,
	getBookById,
	getWordsForBookById,
} from '@/db/queries/hebrew-reader'
import { getTranslations } from 'next-intl/server'

interface PageProps {
	params: Promise<{ locale: string; bookName: string }>
}

export default async function DictionaryPage({ params }: PageProps) {
	const { locale } = await params

	const t = await getTranslations({ locale, namespace: 'reader' })

	const { bookName } = await params
	const bookId = await getBookId(bookName)

	if (!bookId) return notFound()

	const book = await getBookById(bookId)
	if (!book) return notFound()

	const words = await getWordsForBookById(bookId)

	return (
		<div className="p-4 md:p-8">
			<HebrewDictionary
				book={book}
				words={words}
				t={{
					searchPlaceholder: t('search.placeholder'),
					sortByChapter: t('breadcrumb.chapter'), // or better: custom key
					sortAlphabetical: t('nav.next'), // replace with real key
					pos: t.raw('pos'), // entire POS map
					grammar: t.raw('grammar'), // full grammar labels
					nav: t.raw('nav'), // prev/next button text
					breadcrumb: t.raw('breadcrumb'), // prev/next button text
				}}
			/>
		</div>
	)
}
