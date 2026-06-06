'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useMemo } from 'react'

type Prayer = {
	id: number | string
	title: string
	hebTitle?: string | null
	titleTransliteration?: string | null
	category?: string | null
}

export default function PrayerList({ prayers }: { prayers: Prayer[] }) {
	const grouped = useMemo(() => {
		return prayers.reduce<Record<string, Prayer[]>>((acc, p) => {
			const key = (p.category && p.category.trim()) || 'Uncategorized'
			acc[key] ??= []
			acc[key].push(p)
			return acc
		}, {})
	}, [prayers])

	const groupsInOrder = useMemo(
		() =>
			Object.keys(grouped)
				.sort()
				.map((k) => [k, grouped[k]] as const),
		[grouped]
	)

	return (
		<div className="space-y-4">
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
								<h3 className="text-3xl font-cardo">{prayer.hebTitle}</h3>

								{prayer.titleTransliteration && (
									<p className="italic text-gray-600">
										{prayer.titleTransliteration}
									</p>
								)}

								<p className="text-lg font-hebrew">{prayer.title}</p>

								<Link
									href={`/he/prayer/${prayer.id}`}
									className="inline-block mt-3 px-3 py-1 bg-sky-600 text-white rounded hover:bg-sky-700 transition"
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
					No prayers found.
				</div>
			)}
		</div>
	)
}
