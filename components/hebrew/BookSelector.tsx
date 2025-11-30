'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
	Select,
	SelectTrigger,
	SelectContent,
	SelectItem,
	SelectValue,
} from '@/components/ui/select'

interface BookItem {
	id: number
	name: string // pretty name: “1 Kings”
	slug: string // URL slug: “1_kings”
	type: string // e.g. “Torah”
}

interface BookSelectorProps {
	locale: string
	books: BookItem[]
	types: string[]
	title: string
	typeLabels: Record<string, string> // <-- add this
	tFilterAll: string
	tSearchPlaceholder: string
}

export default function BookSelector({
	locale,
	books,
	types,
	typeLabels,
	title,
	tFilterAll,
	tSearchPlaceholder,
}: BookSelectorProps) {
	const [filter, setFilter] = useState<string>('all')
	const [search, setSearch] = useState('')

	// Apply filter + search
	const filteredBooks = useMemo(() => {
		return books.filter((b) => {
			const matchesType = filter === 'all' || b.type === filter
			const matchesSearch = b.name.toLowerCase().includes(search.toLowerCase())
			return matchesType && matchesSearch
		})
	}, [books, filter, search])

	// Group by type
	const booksByType = useMemo(() => {
		return filteredBooks.reduce<Record<string, BookItem[]>>((acc, b) => {
			if (!acc[b.type]) acc[b.type] = []
			acc[b.type].push(b)
			return acc
		}, {})
	}, [filteredBooks])

	return (
		<div className="flex flex-col gap-6" dir="rtl">
			{/* ─────────────────────────────────────────────── TOP NAV  ─────────────────────────────────────────────── */}
			<div className="flex justify-between items-center w-full mb-2" dir="ltr">
				{/* LEFT = TYPE FILTER */}
				<div className="w-48">
					<Select value={filter} onValueChange={setFilter}>
						<SelectTrigger>
							<SelectValue>
								{filter === 'all' ? tFilterAll : typeLabels[filter]}
							</SelectValue>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">{tFilterAll}</SelectItem>
							{types.map((t) => (
								<SelectItem key={t} value={t}>
									{typeLabels[t]}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* CENTER TITLE */}
				<h1 className="text-2xl font-bold">{title}</h1>

				{/* RIGHT = SEARCH BAR */}
				<div className="w-48">
					<Input
						type="text"
						placeholder={tSearchPlaceholder}
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
				</div>
			</div>

			{/* ─────────────────────────────────────────────── BOOK GROUPS  ─────────────────────────────────────────────── */}
			<div className="space-y-10">
				{Object.entries(booksByType).map(([type, list]) => (
					<div key={type} className="space-y-4">
						<h2 className="text-xl font-semibold text-gray-700" dir="rtl">
							{typeLabels[type]}
						</h2>

						{/* FLEX WRAP instead of fixed grid → allows long names */}
						<div className="flex flex-wrap gap-3" dir="rtl">
							{list.map((book) => (
								<Link
									key={book.id}
									href={`/${locale}/reader/hebrew/${book.slug}`}
									className="block"
								>
									<Button
										variant="outline"
										className="px-4 py-3 text-md whitespace-normal h-auto"
									>
										{book.name}
									</Button>
								</Link>
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
