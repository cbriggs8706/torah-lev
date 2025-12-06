// app/[locale]/(app)/reader/hebrew/[bookName]/dictionary/page.tsx

import { notFound } from 'next/navigation'
import HebrewDictionary from '@/components/hebrew/HebrewDictionary'
import {
	getBookId,
	getBookById,
	getWordsForBook,
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

	const words = await getWordsForBook(bookName)

	return (
		<div className="p-4 md:p-8">
			<HebrewDictionary
				locale={locale}
				book={book}
				words={words}
				t={{
					searchPlaceholder: t('search.placeholder'),
					pos: t.raw('pos'),
					grammar: t.raw('grammar'),
					nav: t.raw('nav'),
					breadcrumb: t.raw('breadcrumb'),
				}}
			/>
		</div>
	)
}
