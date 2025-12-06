// components/admin/IngestHebrewForm.tsx

'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ingestHebrewChapter } from '@/app/actions/ingest-hebrew-chapter'
import { HebrewBook } from '@/db/queries/hebrew-reader'

export function IngestHebrewForm({ books }: { books: HebrewBook[] }) {
	const [bookId, setBookId] = useState('')
	const [chapterNumber, setChapterNumber] = useState('')
	const [text, setText] = useState('')
	const [isPending, startTransition] = useTransition()
	const [message, setMessage] = useState('')

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault()
				startTransition(async () => {
					const res = await ingestHebrewChapter({
						bookId: Number(bookId),
						chapterNumber: Number(chapterNumber),
						text,
					})
					setMessage(res.message)
				})
			}}
			className="space-y-6"
		>
			{/* BOOK SELECT */}
			<div>
				<label className="font-semibold">Book</label>
				<select
					className="w-full border p-2 rounded"
					value={bookId}
					onChange={(e) => setBookId(e.target.value)}
					required
				>
					<option value="">Select Book</option>
					{books.map((b) => (
						<option key={b.id} value={b.id}>
							{b.name}
						</option>
					))}
				</select>
			</div>

			{/* CHAPTER NUMBER */}
			<div>
				<label className="font-semibold">Chapter Number</label>
				<Input
					type="number"
					value={chapterNumber}
					onChange={(e) => setChapterNumber(e.target.value)}
					required
				/>
			</div>

			{/* TEXT AREA */}
			<div>
				<label className="font-semibold">Chapter Text</label>
				<Textarea
					value={text}
					onChange={(e) => setText(e.target.value)}
					rows={16}
					required
				/>
				<p className="text-sm text-gray-500">Paragraph =Verse</p>
			</div>

			<Button disabled={isPending} type="submit">
				{isPending ? 'Processing…' : 'Save Chapter'}
			</Button>

			{message && <p className="text-green-700 font-medium">{message}</p>}
		</form>
	)
}
