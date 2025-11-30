// app/[locale]/(app)/reader/hebrew/[bookName]/[chapterNumber]/page.tsx

import {
	getBookId,
	getChapterId,
	getWordsForChapter,
	dbNameFromSlug,
} from '@/db/queries/hebrew-reader'
import HebrewReader from '@/components/hebrew/HebrewReader'
import { getTranslations } from 'next-intl/server'

interface PageProps {
	params: Promise<{
		locale: string
		bookName: string
		chapterNumber: string
	}>
}

export default async function Page({ params }: PageProps) {
	const { locale, bookName, chapterNumber } = await params
	const chapterNum = Number(chapterNumber)

	const tBooks = await getTranslations({ locale, namespace: 'books' })

	function dbNameToKey(name: string) {
		return name
			.toLowerCase()
			.replace(/\s+/g, '_') // spaces → underscores
			.replace(/[–—-]/g, '_') // hyphens/dashes → underscores
	}

	// Convert slug → DB name
	const dbBookName = dbNameFromSlug(bookName)

	// 1. Resolve bookName → bookId
	const bookId = await getBookId(dbBookName)
	if (!bookId) {
		return <div className="p-4 text-xl">Unknown book: {bookName}</div>
	}

	// 2. Resolve chapterId
	const chapterId = await getChapterId(bookId, chapterNum)
	if (!chapterId) {
		return <div className="p-4 text-xl">Chapter not found.</div>
	}

	// 3. Fetch words
	const words = await getWordsForChapter(chapterId)

	return (
		<div className="p-4 md:p-8">
			<HebrewReader
				locale={locale}
				bookName={tBooks(dbNameToKey(dbBookName))}
				bookSlug={bookName} // slug "2_kings"
				chapterNumber={chapterNum}
				words={words}
			/>
		</div>
	)
}
