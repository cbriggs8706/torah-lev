'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import MemorizeModeMenu from './english-verse-mode-menu'
import MemorizeControls from '../memorize-controls'
import { Button } from '../ui/button'

type BookMeta = { bookId: string; bookName: string }

export default function VerseSelector({ bookList }: { bookList: BookMeta[] }) {
	const [selectedBook, setSelectedBook] = useState<BookMeta | null>(null)
	const [bookData, setBookData] = useState<any | null>(null)
	const [selectedChapter, setSelectedChapter] = useState<any | null>(null)
	const [range, setRange] = useState<{
		start: number | null
		end: number | null
	}>({
		start: null,
		end: null,
	})
	const [isStarted, setIsStarted] = useState(false)

	useEffect(() => {
		if (!selectedBook) return
		setBookData(null)

		const path = `/data/english/books/${selectedBook.bookId.toLowerCase()}.json`
		console.log('📖 Fetching book data from:', path)

		fetch(path)
			.then((res) => {
				if (!res.ok) throw new Error(`Failed to load: ${path}`)
				return res.json()
			})
			.then((data) => {
				console.log('✅ Loaded book:', data.bookName)
				setBookData(data)
			})
			.catch((err) => console.error('❌ Fetch error:', err))
	}, [selectedBook])

	if (isStarted && selectedChapter && bookData) {
		const verses = selectedChapter.verses.filter(
			(v: any) => v.number >= range.start! && v.number <= range.end!
		)
		return (
			<MemorizeModeMenu verses={verses} onBack={() => setIsStarted(false)} />
		)
	}

	return (
		<div className="space-y-6">
			{/* BOOK DROPDOWN */}
			<div className="flex justify-center">
				<select
					className="border rounded-lg px-3 py-2"
					value={selectedBook?.bookId || ''}
					onChange={(e) => {
						const book = bookList.find((b) => b.bookId === e.target.value)
						setSelectedBook(book || null)
						setSelectedChapter(null)
						setRange({ start: null, end: null })
					}}
				>
					<option value="">Select a Book</option>
					{bookList.map((b) => (
						<option key={b.bookId} value={b.bookId}>
							{b.bookName}
						</option>
					))}
				</select>
			</div>

			{/* CHAPTER SELECTOR */}
			{bookData && (
				<div className="flex justify-center">
					<select
						className="border rounded-lg px-3 py-2"
						value={selectedChapter?.number || ''}
						onChange={(e) => {
							const chapter = bookData.chapters.find(
								(c: any) => c.number === Number(e.target.value)
							)
							setSelectedChapter(chapter)
							setRange({ start: null, end: null })
						}}
					>
						<option value="">Select a Chapter</option>
						{bookData.chapters.map((c: any) => (
							<option key={c.number} value={c.number}>
								{c.number}. {c.title}
							</option>
						))}
					</select>
				</div>
			)}

			{/* VERSE RANGE SELECTOR */}
			{selectedChapter && (
				<div className="border rounded-lg p-3 shadow-sm mb-20">
					<h3 className="font-semibold mb-3">
						Chapter {selectedChapter.number}: {selectedChapter.title}
					</h3>

					<div className="flex flex-col gap-2">
						{selectedChapter.verses.map((v: any) => {
							const isSelected =
								range.start !== null &&
								range.end !== null &&
								v.number >= range.start &&
								v.number <= range.end

							return (
								<div
									key={v.number}
									onClick={() => {
										if (range.start === null) {
											setRange({ start: v.number, end: v.number })
										} else if (
											range.start !== null &&
											range.end === range.start
										) {
											const start = Math.min(range.start, v.number)
											const end = Math.max(range.start, v.number)
											setRange({ start, end })
										} else {
											setRange({ start: v.number, end: v.number })
										}
									}}
									className={`p-2 rounded cursor-pointer transition border ${
										isSelected
											? 'bg-blue-100 border-blue-400'
											: 'hover:bg-gray-50 border-transparent'
									}`}
								>
									<span className="font-semibold mr-2">{v.number}.</span>{' '}
									{v.text}
								</div>
							)
						})}
					</div>
				</div>
			)}

			{/* Bottom Bar (Back + Memorize) */}
			{selectedChapter && range.start !== null && range.end !== null && (
				<MemorizeControls
					fontSize={0}
					onFontChange={() => {}}
					onBack={() => {
						if (selectedChapter) setSelectedChapter(null)
						else setSelectedBook(null)
					}}
					showFontButtons={false}
				>
					<Button
						onClick={() => setIsStarted(true)}
						variant="secondary"
						className="w-full max-w-md"
					>
						Memorize {selectedBook?.bookName} {selectedChapter.number}:
						{range.start}
						{range.end !== range.start && `–${range.end}`}
					</Button>
				</MemorizeControls>
			)}
		</div>
	)
}
