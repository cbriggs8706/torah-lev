'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
	Select,
	SelectTrigger,
	SelectContent,
	SelectItem,
	SelectValue,
} from '@/components/ui/select'

type Song = {
	id: number | string
	title: string
	hebTitle?: string | null
	titleTransliteration?: string | null
	category?: string | null
	audio?: string | null
	image?: string | null
	video?: string | null
	public: boolean
}

const normalizeCategory = (category?: string | null) =>
	(category && category.trim()) || 'Uncategorized'

const isWorshipCategory = (category: string) => {
	const normalized = category.trim().toLowerCase()
	return normalized === 'worship' || normalized === 'worship songs' || normalized === 'worships'
}

const sortCategories = (categories: string[]) =>
	[...categories].sort((a, b) => {
		const aIsWorship = isWorshipCategory(a)
		const bIsWorship = isWorshipCategory(b)

		if (aIsWorship && !bIsWorship) return -1
		if (!aIsWorship && bIsWorship) return 1

		return a.localeCompare(b)
	})

export default function SongList({
	songs,
	isFriend,
}: {
	songs: Song[]
	isFriend: boolean
}) {
	const filteredSongs = useMemo(
		() => (isFriend ? songs : songs.filter((s) => s.public)),
		[songs, isFriend]
	)

	const categories = useMemo(() => {
		const set = new Set(filteredSongs.map((song) => normalizeCategory(song.category)))
		return ['All', ...sortCategories(Array.from(set))]
	}, [filteredSongs])

	const [selectedCategory, setSelectedCategory] = useState<string>('All')

	const visibleSongs = useMemo(() => {
		if (selectedCategory === 'All') return filteredSongs
		return filteredSongs
			.filter((song) => normalizeCategory(song.category))
			.filter((song) => normalizeCategory(song.category) === selectedCategory)
	}, [filteredSongs, selectedCategory])

	const grouped = useMemo(() => {
		return visibleSongs.reduce<Record<string, Song[]>>((acc, song) => {
			const key = normalizeCategory(song.category)
			acc[key] ??= []
			acc[key].push(song)
			return acc
		}, {})
	}, [visibleSongs])

	const groupsInOrder = useMemo(
		() =>
			sortCategories(Object.keys(grouped)).map((category) => [
				category,
				grouped[category],
			] as const),
		[grouped]
	)

	return (
		<div className="space-y-4">
			{/* Header + Filter */}
			<div className="flex items-center justify-between gap-3">
				{/* Filter button */}
				<div className="flex items-center gap-2">
					<Select value={selectedCategory} onValueChange={setSelectedCategory}>
						<SelectTrigger className="w-[200px]">
							<SelectValue placeholder="Filter by category" />
						</SelectTrigger>
						<SelectContent>
							{categories.map((cat) => (
								<SelectItem key={cat} value={cat}>
									{cat}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{selectedCategory !== 'All' && (
						<Button
							variant="primaryOutline"
							onClick={() => setSelectedCategory('All')}
						>
							Clear
						</Button>
					)}
				</div>
			</div>

			{/* Grouped lists */}
			{groupsInOrder.map(([cat, items]) => (
				<div key={cat} className="space-y-2">
					<h2 className="text-lg font-semibold text-neutral-700 uppercase">
						{cat}
					</h2>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" dir="rtl">
						{items.map((music) => (
							<div
								key={music.id}
								className="rounded-lg border p-4 shadow hover:shadow-md transition bg-white"
							>
								{/* Small centered thumbnail that preserves the whole image */}
								{music.image && (
									<div className="w-full flex justify-center mb-3">
										<Image
											src={music.image}
											alt={`${music.title} thumbnail`}
											width={520} // 👈 scale this up/down to taste (e.g., 420/480)
											height={0} // height auto (ignored; keeps aspect ratio)
											className="h-auto w-auto max-w-full rounded-md border"
											sizes="(max-width: 640px) 90vw, (max-width: 1024px) 40vw, 320px"
											// placeholder={music.blurDataURL ? 'blur' : 'empty'}
											// blurDataURL={music.blurDataURL || undefined}
										/>
									</div>
								)}

								<h3 className="text-4xl font-times">{music.hebTitle}</h3>

								{music.hebTitle && (
									<p className="text-base font-nunito mt-1">{music.title}</p>
								)}

								{music.titleTransliteration && (
									<p className="italic mt-0.5 text-gray-600">
										{music.titleTransliteration}
									</p>
								)}

								<Link
									href={`/he/music/${music.id}`}
									className="inline-block mt-3 px-3 py-1 bg-sky-600 text-white rounded hover:bg-sky-700 transition"
									scroll
								>
									שיר
								</Link>
							</div>
							// <div
							// 	key={music.id}
							// 	className="rounded-lg border p-4 shadow hover:shadow-md transition"
							// >
							// 	<h3 className="text-xl font-semibold">{music.title}</h3>

							// 	{music.hebTitle && (
							// 		<p className="text-lg font-hebrew">{music.hebTitle}</p>
							// 	)}

							// 	{music.titleTransliteration && (
							// 		<p className="italic text-gray-600">
							// 			{music.titleTransliteration}
							// 		</p>
							// 	)}

							// 	<Link
							// 		href={`/he/music/${music.id}`}
							// 		className="inline-block mt-3 px-3 py-1 bg-sky-600 text-white rounded hover:bg-sky-700 transition"
							// 		scroll
							// 	>
							// 		View Song
							// 	</Link>
							// </div>
						))}
					</div>
				</div>
			))}

			{/* Empty state */}
			{groupsInOrder.length === 0 && (
				<div className="text-center text-sm text-neutral-500 py-12">
					No songs found in this category.
				</div>
			)}
		</div>
	)
}
