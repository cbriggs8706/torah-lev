'use client'

import { useState, useMemo } from 'react'
import {
	Select,
	SelectTrigger,
	SelectContent,
	SelectItem,
	SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
	Table,
	TableHeader,
	TableRow,
	TableHead,
	TableBody,
	TableCell,
} from '@/components/ui/table'
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from '../ui/pagination'

// ------------------ TYPES ------------------

interface HebrewDictionaryProps {
	book: {
		id: number
		name: string
	}
	words: Array<{
		id: string
		surface: string
		lemma: string | null
		lemmaVocalized: string | null
		partOfSpeech: string | null
		wordSeq: number
		chapter: { chapterNumber: number }
		verse: { verseNumber: number }
	}>
	t: {
		searchPlaceholder: string
		sortByChapter: string
		sortAlphabetical: string
		pos: Record<string, string>
		grammar: Record<string, string>
		breadcrumb: Record<string, string>
		nav: { next: string; prev: string }
	}
}

// ------------------ COMPONENT ------------------

export default function HebrewDictionary({
	book,
	words,
	t,
}: HebrewDictionaryProps) {
	const [sortMode, setSortMode] = useState<'chapter' | 'alpha'>('alpha')
	const [query, setQuery] = useState('')
	const [page, setPage] = useState(1)
	const pageSize = 100

	// Normalize lemma keys for dictionary-level uniqueness
	function normalizeLemma(w: {
		lemma: string | null
		lemmaVocalized: string | null
	}) {
		// Prefer Hebrew lemmaVocalized
		let base = w.lemmaVocalized ?? ''

		if (!base) {
			// fallback to lemma (remove slashes etc)
			base = (w.lemma ?? '').replace(/[^A-Za-z]/g, '')
		}

		return base
			.normalize('NFD')
			.replace(/[\u0591-\u05C7]/g, '') // remove vowels + cantillation
			.replace(/[^\u05D0-\u05EA]/g, '') // keep Hebrew letters only
			.trim()
	}

	/* ------------------ FILTERING & SORTING ------------------ */
	const filtered = useMemo(() => {
		const q = query.trim()

		let result = [...words]

		if (q.length > 0) {
			result = result.filter(
				(w) =>
					w.surface.includes(q) ||
					w.lemma?.includes(q) ||
					w.lemmaVocalized?.includes(q)
			)
		}

		if (sortMode === 'alpha') {
			result.sort((a, b) => a.surface.localeCompare(b.surface))
		} else {
			result.sort((a, b) => {
				if (a.chapter.chapterNumber !== b.chapter.chapterNumber)
					return a.chapter.chapterNumber - b.chapter.chapterNumber
				return a.wordSeq - b.wordSeq
			})
		}

		// ------------------------
		// DEDUPE BY NORMALIZED LEMMA
		// ------------------------
		const uniqueByLemma = new Map<string, (typeof result)[0]>()
		for (const w of result) {
			const key = normalizeLemma(w)
			if (!uniqueByLemma.has(key)) {
				uniqueByLemma.set(key, w)
			}
		}

		return Array.from(uniqueByLemma.values())
	}, [words, sortMode, query])

	/* ------------------ PAGINATION ------------------ */
	const totalPages = Math.ceil(filtered.length / pageSize)

	// Ensure page stays in bounds when filtering changes
	if (page > totalPages && totalPages > 0) {
		setPage(1)
	}

	const pageData = useMemo(() => {
		const start = (page - 1) * pageSize
		return filtered.slice(start, start + pageSize)
	}, [filtered, page])

	return (
		<div className="flex flex-col gap-6" dir="rtl">
			{/* HEADER */}
			<div className="flex justify-between items-center w-full mb-2" dir="ltr">
				{/* Sorting */}
				<div className="w-48">
					<Select
						value={sortMode}
						onValueChange={(val) => setSortMode(val as 'chapter' | 'alpha')}
					>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Sort" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="chapter">By Chapter</SelectItem>
							<SelectItem value="alpha">Alphabetical</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{/* Title */}
				<h1 className="text-2xl font-bold text-center flex-1">
					Dictionary: {book.name}
				</h1>

				{/* Search */}
				<div className="w-48">
					<Input
						placeholder={t.searchPlaceholder}
						value={query}
						onChange={(e) => {
							setQuery(e.target.value)
							setPage(1) // Reset pagination on search
						}}
					/>
				</div>
			</div>

			{/* TABLE */}
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>{t.grammar.lemma}</TableHead>
						<TableHead>{t.grammar.translation}</TableHead>
						<TableHead>{t.grammar.transliteration}</TableHead>
						<TableHead>{t.grammar.pos}</TableHead>
						<TableHead>{t.breadcrumb.chapter}</TableHead>
					</TableRow>
				</TableHeader>

				<TableBody>
					{pageData.map((w) => (
						<TableRow key={w.id}>
							<TableCell className="font-serif text-2xl">{w.surface}</TableCell>
							<TableCell className="font-hebrew">{w.lemmaVocalized}</TableCell>
							<TableCell dir="ltr">{w.lemma}</TableCell>
							<TableCell>
								{' '}
								{w.partOfSpeech ? t.pos[w.partOfSpeech] ?? w.partOfSpeech : ''}
							</TableCell>
							<TableCell>
								{w.chapter.chapterNumber}:{w.verse.verseNumber}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>

			{/* SHADCN PAGINATION */}
			<Pagination>
				<PaginationContent>
					{/* PREVIOUS */}
					<PaginationItem>
						<LocalizedPrevious
							onClick={() => page > 1 && setPage(page - 1)}
							disabled={page <= 1}
							label={t.nav.prev}
						/>
					</PaginationItem>

					{/* PAGE WINDOW (10 numbers) */}
					{(() => {
						const windowSize = 10
						const half = Math.floor(windowSize / 2)

						let start = Math.max(1, page - half)
						let end = start + windowSize - 1

						if (end > totalPages) {
							end = totalPages
							start = Math.max(1, end - windowSize + 1)
						}

						const items = []
						for (let p = start; p <= end; p++) {
							items.push(
								<PaginationItem key={p}>
									<PaginationLink
										onClick={() => setPage(p)}
										isActive={p === page}
									>
										{p}
									</PaginationLink>
								</PaginationItem>
							)
						}
						return items
					})()}

					{/* NEXT */}
					<PaginationItem>
						<LocalizedNext
							onClick={() => page < totalPages && setPage(page + 1)}
							disabled={page >= totalPages}
							label={t.nav.next}
						/>
					</PaginationItem>
				</PaginationContent>
			</Pagination>

			{/* DIRECT PAGE INPUT */}
			<div
				className="flex w-full justify-center items-center gap-2 mt-4"
				dir="ltr"
			>
				<span className="font-medium">Go to page:</span>
				<Input
					type="number"
					min={1}
					max={totalPages}
					defaultValue={page}
					onKeyDown={(e) => {
						if (e.key === 'Enter') {
							const value = Number((e.target as HTMLInputElement).value)
							if (!isNaN(value)) {
								setPage(Math.min(Math.max(value, 1), totalPages))
							}
						}
					}}
					className="w-24"
				/>
				<span className="text-sm text-muted-foreground">of {totalPages}</span>
			</div>
		</div>
	)
}

function LocalizedPrevious({
	disabled,
	onClick,
	label,
}: {
	disabled?: boolean
	onClick?: () => void
	label: string
}) {
	return (
		<button
			onClick={onClick}
			disabled={disabled}
			className={`
                flex items-center gap-1 px-3 py-2 text-sm border rounded-md
                bg-background hover:bg-accent hover:text-accent-foreground
                disabled:opacity-50 disabled:pointer-events-none
                transition-colors
            `}
		>
			{/* Arrow pointing LEFT (auto-rotated in RTL by CSS on parent) */}
			<span className="inline-block">&rarr;</span>
			<span>{label}</span>
		</button>
	)
}

function LocalizedNext({
	disabled,
	onClick,
	label,
}: {
	disabled?: boolean
	onClick?: () => void
	label: string
}) {
	return (
		<button
			onClick={onClick}
			disabled={disabled}
			className={`
                flex items-center gap-1 px-3 py-2 text-sm border rounded-md
                bg-background hover:bg-accent hover:text-accent-foreground
                disabled:opacity-50 disabled:pointer-events-none
                transition-colors
            `}
		>
			<span>{label}</span>
			{/* Arrow pointing RIGHT */}
			<span className="inline-block">&larr;</span>
		</button>
	)
}
