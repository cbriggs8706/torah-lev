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

type Prayer = {
	id: number | string
	title: string
	hebTitle?: string | null
	titleTransliteration?: string | null
	category?: string | null
}

export default function PrayerList({ prayers }: { prayers: Prayer[] }) {
	const categories = useMemo(() => {
		const set = new Set(
			prayers.map((p) => (p.category && p.category.trim()) || 'Uncategorized')
		)
		return ['All', ...Array.from(set).sort()]
	}, [prayers])

	const [selectedCategory, setSelectedCategory] = useState<string>('All')

	const visiblePrayers = useMemo(() => {
		if (selectedCategory === 'All') return prayers
		return prayers
			.filter((p) => (p.category && p.category.trim()) || 'Uncategorized')
			.filter(
				(p) =>
					((p.category && p.category.trim()) || 'Uncategorized') ===
					selectedCategory
			)
	}, [prayers, selectedCategory])

	const grouped = useMemo(() => {
		return visiblePrayers.reduce<Record<string, Prayer[]>>((acc, p) => {
			const key = (p.category && p.category.trim()) || 'Uncategorized'
			acc[key] ??= []
			acc[key].push(p)
			return acc
		}, {})
	}, [visiblePrayers])

	const groupsInOrder = useMemo(
		() =>
			Object.keys(grouped)
				.sort()
				.map((k) => [k, grouped[k]] as const),
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
						{items.map((prayer) => (
							<div
								key={prayer.id}
								className="rounded-lg border p-4 shadow hover:shadow-md transition"
							>
								<h3 className="text-xl font-semibold">{prayer.title}</h3>

								{prayer.hebTitle && (
									<p className="text-lg font-hebrew">{prayer.hebTitle}</p>
								)}

								{prayer.titleTransliteration && (
									<p className="italic text-gray-600">
										{prayer.titleTransliteration}
									</p>
								)}

								<Link
									href={`/he/prayer/${prayer.id}`}
									className="inline-block mt-3 px-3 py-1 bg-sky-500 text-white rounded hover:bg-sky-700 transition"
								>
									התפלל
								</Link>
							</div>
						))}
					</div>
				</div>
			))}

			{/* Empty state */}
			{groupsInOrder.length === 0 && (
				<div className="text-center text-sm text-neutral-500 py-12">
					No prayers found in this category.
				</div>
			)}
		</div>
	)
}
