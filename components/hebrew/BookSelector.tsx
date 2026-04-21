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
		<div className="flex flex-col gap-8" dir="rtl">
			<div
				className="flex w-full flex-col gap-4 rounded-[1.8rem] border border-border/70 bg-background/78 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] md:flex-row md:items-center md:justify-between"
				dir="ltr"
			>
				<div className="w-full md:w-52">
					<Select value={filter} onValueChange={setFilter}>
						<SelectTrigger className="w-full rounded-2xl bg-background/90">
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

				<div className="text-center">
					<p className="tl-kicker">Reader</p>
					<h1 className="tl-heading text-3xl font-semibold md:text-4xl">
						{title}
					</h1>
				</div>

				<div className="w-full md:w-52">
					<Input
						type="text"
						className="rounded-2xl bg-background/90"
						placeholder={tSearchPlaceholder}
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
				</div>
			</div>

			<div className="space-y-10">
				{Object.entries(booksByType).map(([type, list]) => (
					<div key={type} className="space-y-4">
						<h2 className="tl-heading text-2xl font-semibold text-foreground" dir="rtl">
							{typeLabels[type]}
						</h2>

						<div className="flex flex-wrap gap-3" dir="rtl">
							{list.map((book) => (
								<Link
									key={book.id}
									href={`/${locale}/reader/hebrew/${book.slug}`}
									className="block"
								>
									<Button
										variant="outline"
										className="h-auto rounded-2xl border-border/80 bg-background/82 px-4 py-3 text-base whitespace-normal"
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
