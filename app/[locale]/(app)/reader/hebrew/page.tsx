// app/[locale]/(app)/reader/hebrew/page.tsx

import { getAllBooks, normalizeBookName } from '@/db/queries/hebrew-reader'
import BookSelector from '@/components/hebrew/BookSelector'
import { getTranslations } from 'next-intl/server'

interface PageProps {
	params: Promise<{ locale: string }>
}

export default async function HebrewBooksPage({ params }: PageProps) {
	const { locale } = await params
	const tTypes = await getTranslations({ locale, namespace: 'reader' })
	const tBooks = await getTranslations({ locale, namespace: 'books' })

	const books = await getAllBooks()

	function dbNameToKey(name: string) {
		return name
			.toLowerCase()
			.replace(/\s+/g, '_') // spaces → underscores
			.replace(/[–—-]/g, '_') // hyphens/dashes → underscores
	}

	// Create UI-friendly objects
	const items = books.map((b) => {
		const key = dbNameToKey(b.name)
		return {
			id: b.id,
			name: tBooks(key),
			slug: normalizeBookName(b.name),
			type: b.type,
		}
	})

	// Collect unique types
	const types = Array.from(new Set(items.map((b) => b.type)))

	const typeLabels = Object.fromEntries(
		types.map((t) => [t, tTypes(`types.${t}`)])
	)

	return (
		<div className="space-y-6">
			<section className="tl-papyrus-scroll px-1 py-4">
				<div className="tl-papyrus-sheet px-5 py-7 md:px-8 md:py-8">
					<div className="tl-vellum-panel rounded-[2rem] px-6 py-6 md:px-8 md:py-7">
						<BookSelector
							locale={locale}
							books={items}
							types={types}
							typeLabels={typeLabels}
							title={tTypes('title')}
							tFilterAll={tTypes('filter.all')}
							tSearchPlaceholder={tTypes('search.placeholder')}
						/>
					</div>
				</div>
			</section>
		</div>
	)
}
