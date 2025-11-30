// app/[locale]/(app)/reader/hebrew/[bookName]/page.tsx
import ChapterSelector from '@/components/hebrew/ChapterSelector'
import {
	getAllBooks,
	getChaptersForBook,
	normalizeBookName,
} from '@/db/queries/hebrew-reader'
import { getTranslations } from 'next-intl/server'

interface ChapterPageProps {
	params: Promise<{ locale: string; bookName: string }>
}

export default async function ChapterPage({ params }: ChapterPageProps) {
	const { locale, bookName } = await params

	const tBooks = await getTranslations({ locale, namespace: 'books' })

	const slug = normalizeBookName(bookName)
	const books = await getAllBooks()

	function dbNameToKey(name: string) {
		return name.toLowerCase().replace(/\s+/g, '_').replace(/[–—-]/g, '_')
	}

	// FIX: create correct slugs for ALL books
	const booksWithSlugs = books.map((b) => ({
		...b,
		slug: normalizeBookName(b.name),
		title: tBooks(dbNameToKey(b.name)), // <-- LOCALIZED
	}))

	// find correct index
	const idx = booksWithSlugs.findIndex((b) => b.slug === slug)
	if (idx === -1) return <div className="p-4">Book not found</div>

	const current = booksWithSlugs[idx]
	const prevBook = idx > 0 ? booksWithSlugs[idx - 1] : null
	const nextBook =
		idx < booksWithSlugs.length - 1 ? booksWithSlugs[idx + 1] : null

	const chapters = await getChaptersForBook(current.name)

	return (
		<div className="p-4 md:p-8">
			<ChapterSelector
				locale={locale}
				bookName={current.title}
				bookSlug={current.slug}
				chapters={chapters}
				prevBook={
					prevBook && {
						name: prevBook.title,
						slug: prevBook.slug,
					}
				}
				nextBook={
					nextBook && {
						name: nextBook.title,
						slug: nextBook.slug,
					}
				}
			/>
		</div>
	)
}
