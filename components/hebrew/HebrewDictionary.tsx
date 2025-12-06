'use client'

import { useState } from 'react'
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
} from '../ui/pagination'

/* -------------------------------------------------------
   TYPES
-------------------------------------------------------- */

interface WordEntry {
	id: string
	surface: string
	lemma: string | null
	lemmaVocalized: string | null
	partOfSpeech: string | null
	wordSeq: number

	glossEnglish?: string | null
	glossEspanol?: string | null
	glossPortugues?: string | null
	glossNetherlands?: string | null
	glossGreek?: string | null
	glossTbesh?: string | null
	meaningTbesh?: string | null
	frequency?: number | null

	chapter: { chapterNumber: number }
	verse: { verseNumber: number }
}

interface HebrewDictionaryProps {
	locale: string
	book: { id: number; name: string }
	words: WordEntry[]
	t: {
		searchPlaceholder: string
		pos: Record<string, string>
		grammar: Record<string, string>
		breadcrumb: Record<string, string>
		nav: { next: string; prev: string }
	}
}

/* -------------------------------------------------------
   COMPONENT
-------------------------------------------------------- */

export default function HebrewDictionary({
	locale,
	book,
	words,
	t,
}: HebrewDictionaryProps) {
	const [sortMode, setSortMode] = useState<'alpha-he' | 'alpha-en' | 'freq'>(
		'freq'
	)
	const [query, setQuery] = useState('')
	const [page, setPage] = useState(1)
	const pageSize = 100

	/* -------------------------------------------------------
	   FILTER + SORT + DEDUPE
	-------------------------------------------------------- */

	const pickGloss = (w: WordEntry): string => {
		switch (locale) {
			case 'en':
				return w.glossEnglish ?? w.glossTbesh ?? w.meaningTbesh ?? ''
			case 'es':
				return w.glossEspanol ?? ''
			case 'pt':
				return w.glossPortugues ?? ''
			case 'nl':
				return w.glossNetherlands ?? ''
			case 'el':
				return w.glossGreek ?? ''
			default:
				return w.glossEnglish ?? w.glossTbesh ?? ''
		}
	}

	const filtered: WordEntry[] = (() => {
		const q = query.trim().toLowerCase()

		let result = words

		if (q.length > 0) {
			result = result.filter((w) => {
				const gloss = pickGloss(w).toLowerCase()
				return (
					w.surface.toLowerCase().includes(q) ||
					w.lemma?.toLowerCase().includes(q) ||
					gloss.includes(q)
				)
			})
		}

		if (sortMode === 'alpha-he') {
			result = [...result].sort((a, b) =>
				(a.lemmaVocalized ?? a.surface).localeCompare(
					b.lemmaVocalized ?? b.surface,
					'he'
				)
			)
		} else if (sortMode === 'alpha-en') {
			result = [...result].sort((a, b) =>
				pickGloss(a).localeCompare(pickGloss(b), 'en')
			)
		} else if (sortMode === 'freq') {
			result = [...result].sort(
				(a, b) => (b.frequency ?? 0) - (a.frequency ?? 0)
			)
		}

		// DEDUPE by lemma
		const seen = new Map<string, WordEntry>()
		for (const w of result) {
			if (w.lemma && !seen.has(w.lemma)) seen.set(w.lemma, w)
		}

		return Array.from(seen.values())
	})()

	/* -------------------------------------------------------
	   PAGINATION
	-------------------------------------------------------- */

	const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
	const currentPage = Math.min(page, totalPages)
	const start = (currentPage - 1) * pageSize
	const pageData = filtered.slice(start, start + pageSize)

	/* -------------------------------------------------------
	   RENDER
	-------------------------------------------------------- */

	return (
		<div className="flex flex-col gap-6" dir="rtl">
			{/* HEADER */}
			<div className="flex justify-between items-center w-full mb-2" dir="ltr">
				<div className="w-48">
					<Select
						value={sortMode}
						onValueChange={(val) =>
							setSortMode(val as 'alpha-he' | 'alpha-en' | 'freq')
						}
					>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Sort" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="alpha-he">Hebrew A → Z</SelectItem>
							<SelectItem value="alpha-en">Translation A → Z</SelectItem>
							<SelectItem value="freq">Most Frequent</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<h1 className="text-2xl font-bold text-center flex-1">
					Dictionary: {book.name}
				</h1>

				<div className="w-48">
					<Input
						placeholder={t.searchPlaceholder}
						value={query}
						onChange={(e) => {
							setQuery(e.target.value)
							setPage(1)
						}}
					/>
				</div>
			</div>

			{/* TABLE */}
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Lemma</TableHead>
						<TableHead>Translation</TableHead>
						<TableHead>TBESH Gloss</TableHead>
						<TableHead>TBESH Meaning</TableHead>
						<TableHead>Freq</TableHead>
						<TableHead>POS</TableHead>
						<TableHead>Ref</TableHead>
					</TableRow>
				</TableHeader>

				<TableBody>
					{pageData.map((w) => (
						<TableRow key={w.id}>
							<TableCell className="font-hebrew text-2xl">
								{w.lemmaVocalized ?? w.surface}
							</TableCell>

							<TableCell>{pickGloss(w)}</TableCell>

							<TableCell>{w.glossTbesh ?? ''}</TableCell>

							<TableCell>{w.meaningTbesh ?? ''}</TableCell>

							<TableCell>{w.frequency ?? 0}</TableCell>

							<TableCell>
								{w.partOfSpeech ? t.pos[w.partOfSpeech] ?? w.partOfSpeech : ''}
							</TableCell>

							<TableCell>
								{w.chapter.chapterNumber}:{w.verse.verseNumber}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>

			{/* PAGINATION */}
			<Pagination>
				<PaginationContent>
					{Array.from({ length: totalPages }, (_, i) => i + 1)
						.slice(Math.max(0, currentPage - 5), currentPage + 4)
						.map((p) => (
							<PaginationItem key={p}>
								<PaginationLink
									isActive={p === currentPage}
									onClick={() => setPage(p)}
								>
									{p}
								</PaginationLink>
							</PaginationItem>
						))}
				</PaginationContent>
			</Pagination>
		</div>
	)
}
