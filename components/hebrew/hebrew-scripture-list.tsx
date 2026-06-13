'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import {
	getTanakhBookDisplayName,
	getTanakhBookOrder,
} from '@/lib/tanakh-books'
import { normalizeSidebarLocale } from '@/lib/sidebar-translations'
import type { SidebarLocale } from '@/types/sidebar'

type Scripture = {
	id: number | string
	title: string | null
	hebTitle?: string | null
	titleTransliteration?: string | null
	image?: string | null
	public: boolean | null
	lessonId?: number | null
	lessonNumber?: string | null
	scriptureBook?: string | null
	scriptureChapter?: number | null
	scriptureVerses?: string | null
}

const textByLocale: Record<
	SidebarLocale,
	{
		noThumbnail: string
		open: string
		locked: string
		empty: string
	}
> = {
	en: {
		noThumbnail: 'No thumbnail',
		open: 'Read',
		locked: 'Locked',
		empty: 'No scripture videos found.',
	},
	es: {
		noThumbnail: 'Sin miniatura',
		open: 'Leer',
		locked: 'Bloqueado',
		empty: 'No se encontraron videos de escritura.',
	},
	he: {
		noThumbnail: 'אין תמונה',
		open: 'קרא',
		locked: 'נעול',
		empty: 'לא נמצאו סרטוני כתבי הקודש.',
	},
	el: {
		noThumbnail: 'Χωρίς μικρογραφία',
		open: 'Ανάγνωση',
		locked: 'Κλειδωμένο',
		empty: 'Δεν βρέθηκαν βίντεο γραφής.',
	},
}

function verseSortValue(verses?: string | null) {
	const first = verses?.match(/\d+/)?.[0]
	return first ? Number(first) : Number.POSITIVE_INFINITY
}

function referenceLabel(scripture: Scripture, locale: SidebarLocale) {
	const book = getTanakhBookDisplayName(scripture.scriptureBook, locale)
	const chapter = scripture.scriptureChapter
	const verses = scripture.scriptureVerses

	if (chapter != null && verses) return `${book} ${chapter}:${verses}`
	if (chapter != null) return `${book} ${chapter}`
	return book
}

export default function HebrewScriptureList({
	scriptures,
	isFriend,
	currentLesson,
	startLocale = 'en',
}: {
	scriptures: Scripture[]
	isFriend: boolean
	currentLesson: number | null
	startLocale?: SidebarLocale
}) {
	const [locale, setLocale] = useState<SidebarLocale>(startLocale)
	const text = textByLocale[locale]
	const isRtlUi = locale === 'he'

	useEffect(() => {
		const syncLocale = (nextLocale?: string | null) => {
			setLocale(nextLocale ? normalizeSidebarLocale(nextLocale) : startLocale)
		}

		syncLocale(localStorage.getItem('sidebarLocale'))

		const handleLocaleChange = (event: Event) => {
			const nextLocale = (event as CustomEvent<{ locale?: string }>).detail?.locale
			syncLocale(nextLocale)
		}

		window.addEventListener('sidebar-locale-changed', handleLocaleChange)
		return () =>
			window.removeEventListener('sidebar-locale-changed', handleLocaleChange)
	}, [startLocale])

	const filteredScriptures = useMemo(
		() => (isFriend ? scriptures : scriptures.filter((s) => s.public)),
		[scriptures, isFriend]
	)

	const grouped = useMemo(() => {
		return filteredScriptures.reduce<Record<string, Scripture[]>>((acc, item) => {
			const key = item.scriptureBook?.trim() || 'Unassigned'
			acc[key] ??= []
			acc[key].push(item)
			return acc
		}, {})
	}, [filteredScriptures])

	const groupsInOrder = useMemo(
		() =>
			Object.keys(grouped)
				.sort((a, b) => {
					const bookOrder = getTanakhBookOrder(a) - getTanakhBookOrder(b)
					return bookOrder || a.localeCompare(b)
				})
				.map((book) => {
					const items = [...grouped[book]].sort((a, b) => {
						const chapter =
							(a.scriptureChapter ?? Number.POSITIVE_INFINITY) -
							(b.scriptureChapter ?? Number.POSITIVE_INFINITY)
						return chapter || verseSortValue(a.scriptureVerses) - verseSortValue(b.scriptureVerses)
					})

					return [book, items] as const
				}),
		[grouped]
	)

	const lessonNum = (n?: number | null) =>
		typeof n === 'number' ? n : Number.POSITIVE_INFINITY

	const lessonBadge = (scripture: Scripture) =>
		scripture.lessonNumber?.trim()

	return (
		<div className="space-y-6">
			{groupsInOrder.map(([book, items]) => (
				<section key={book} className="space-y-2">
					<h2
						className="text-lg font-semibold text-neutral-700 uppercase"
						dir={isRtlUi ? 'rtl' : 'ltr'}
					>
						{getTanakhBookDisplayName(book, locale)}
					</h2>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" dir="rtl">
						{items.map((scripture) => {
							const isLocked =
								currentLesson !== null &&
								lessonNum(scripture.lessonId) > currentLesson

							return (
								<div
									key={scripture.id}
									className="relative overflow-hidden rounded-lg border bg-white shadow transition hover:shadow-md"
								>
									{lessonBadge(scripture) && (
										<div className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-sky-600 text-sm font-bold text-white shadow">
											{lessonBadge(scripture)}
										</div>
									)}

									<Link href={`/he/scripture/${scripture.id}`} className="block">
										<div className="relative aspect-[16/9]">
											{scripture.image ? (
												<Image
													src={scripture.image}
													alt={scripture.title ?? referenceLabel(scripture, locale)}
													fill
													priority={false}
													className="object-cover"
													sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
												/>
											) : (
												<div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-sky-100 to-sky-200 text-sky-700">
													<span className="text-sm font-medium opacity-80">
														{text.noThumbnail}
													</span>
												</div>
											)}
										</div>
									</Link>

									<div className="p-4" dir="rtl">
										<p
											className="font-nunito text-sm font-bold text-sky-700"
											dir={isRtlUi ? 'rtl' : 'ltr'}
										>
											{referenceLabel(scripture, locale)}
										</p>
										<h3 className="mt-1 font-times text-4xl">
											{scripture.hebTitle}
										</h3>
										{scripture.title && (
											<p className="mt-1 font-nunito text-base" dir="ltr">
												{scripture.title}
											</p>
										)}
										{scripture.titleTransliteration && (
											<p className="mt-0.5 italic text-gray-600">
												{scripture.titleTransliteration}
											</p>
										)}
										<div className="mt-3">
											<Link
												href={`/he/scripture/${scripture.id}`}
												className="inline-block rounded bg-sky-600 px-3 py-1 text-white transition hover:bg-sky-700"
											>
												{text.open}
											</Link>
											{isLocked && (
												<span className="mr-3 text-sm text-neutral-500">
													{text.locked}
												</span>
											)}
										</div>
									</div>
								</div>
							)
						})}
					</div>
				</section>
			))}

			{groupsInOrder.length === 0 && (
				<div className="py-12 text-center text-sm text-neutral-500">
					{text.empty}
				</div>
			)}
		</div>
	)
}
