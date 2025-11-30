'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

interface BookNav {
	name: string
	slug: string
}

interface ChapterSelectorProps {
	locale: string
	bookName: string // already formatted (e.g., "1 Kings")
	bookSlug: string // slug used in URLs
	chapters: number[]
	prevBook: BookNav | null
	nextBook: BookNav | null
}

export default function ChapterSelector({
	locale,
	bookName,
	bookSlug,
	chapters,
	prevBook,
	nextBook,
}: ChapterSelectorProps) {
	const baseUrl = `/${locale}/reader/hebrew`
	const t = useTranslations('reader')

	return (
		<div className="flex flex-col gap-6" dir="rtl">
			{/* TOP NAV */}
			<div className="flex justify-between items-center w-full mb-2" dir="ltr">
				{nextBook ? (
					<Link href={`${baseUrl}/${nextBook.slug}`}>
						<Button variant="outline">
							{'<'} {nextBook.name}
						</Button>
					</Link>
				) : (
					<div />
				)}

				<h1 className="text-2xl font-bold">{bookName}</h1>

				{prevBook ? (
					<Link href={`${baseUrl}/${prevBook.slug}`}>
						<Button variant="outline">
							{prevBook.name} {'>'}
						</Button>
					</Link>
				) : (
					<div />
				)}
			</div>

			{/* 🔵 DICTIONARY BUTTON */}
			<div className="flex justify-center" dir="ltr">
				<Link href={`${baseUrl}/${bookSlug}/dictionary`}>
					<Button variant="default" className="px-6 text-lg">
						{t('nav.openDic')} {bookName}
					</Button>
				</Link>
			</div>

			{/* CHAPTER LIST */}
			<div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
				{chapters.map((num) => (
					<Link
						key={num}
						href={`${baseUrl}/${bookSlug}/${num}`}
						className="block"
					>
						<Button variant="outline" className="w-full text-lg py-6">
							{num}
						</Button>
					</Link>
				))}
			</div>
		</div>
	)
}
