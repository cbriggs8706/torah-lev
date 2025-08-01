// challenge.options = challenge.options.filter(
// 				(_: any, i: number) => i !== optionIndex
// 			)
'use client'

import { Trash } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useNotify } from 'react-admin'

interface Lesson {
	id: number
	title: string
}

const challengeTypes = [
	'AUDIO-VISUAL',
	'AUDIO-TEXT',
	'VISUAL-AUDIO',
	'VISUAL-TEXT',
	'TEXT-AUDIO',
	'TEXT-VISUAL',
] as const

export default function GenerateChallengesPage() {
	const [type, setType] =
		useState<(typeof challengeTypes)[number]>('AUDIO-VISUAL')
	const [lessons, setLessons] = useState<Lesson[]>([])
	const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null)
	const [loading, setLoading] = useState(false)
	const [message, setMessage] = useState('')
	const [preview, setPreview] = useState<any[] | null>(null)
	const notify = useNotify()

	const handlePreview = async () => {
		if (!selectedLessonId) return

		setLoading(true)
		try {
			const res = await fetch('/api/preview-challenges', {
				method: 'POST',
				body: JSON.stringify({ lessonId: selectedLessonId, type }),
				headers: { 'Content-Type': 'application/json' },
			})
			const data = await res.json()
			const filteredData = data.map((challenge: any) => {
				// If challenge.type is "word", keep only word options
				if (challenge.type === 'word') {
					return {
						...challenge,
						options: challenge.options.filter(
							(opt: any) => opt.type === 'word'
						),
					}
				}
				// If phrase, leave options unchanged
				return challenge
			})
			setPreview(filteredData)
		} catch (err) {
			notify('Error generating preview', { type: 'error' })
		} finally {
			setLoading(false)
		}
	}

	const handleGenerate = async () => {
		if (!selectedLessonId || isNaN(Number(selectedLessonId))) {
			setMessage('Please select a valid lesson.')
			return
		}

		setLoading(true)
		setMessage('')

		try {
			const res = await fetch('/api/generate-challenges', {
				method: 'POST',
				body: JSON.stringify({
					lessonId: selectedLessonId,
					type,
					challenges: preview, // ✅ send modified preview
				}),
				headers: { 'Content-Type': 'application/json' },
			})

			const result = await res.json()
			if (!res.ok) throw new Error(result.message || 'Failed')
			setMessage(result.message || 'Success!')
		} catch (err: any) {
			setMessage(err.message)
		} finally {
			setLoading(false)
		}
	}

	const handleRemoveDistractor = (
		challengeIndex: number,
		optionIndex: number
	) => {
		setPreview((prev) => {
			if (!prev) return prev
			const updated = [...prev]
			const challenge = { ...updated[challengeIndex] }
			challenge.options = challenge.options.filter(
				(_: any, i: number) => i !== optionIndex
			)
			updated[challengeIndex] = challenge
			return updated
		})
	}

	useEffect(() => {
		fetch('/api/lessons?sort=["order","ASC"]&range=[0,999]')
			.then((res) => res.json())
			.then((data) => setLessons(data))
	}, [])

	return (
		<main className="max-w-xl mx-auto p-6">
			<h1 className="text-2xl font-bold mb-4">Generate Challenges</h1>

			<label className="block mb-2 font-medium">Lesson</label>
			<select
				value={selectedLessonId ?? ''}
				onChange={(e) => setSelectedLessonId(Number(e.target.value))}
				className="border px-3 py-2 mb-4 w-full rounded"
			>
				<option value="">Select a lesson</option>
				{lessons.map((lesson) => (
					<option key={lesson.id} value={lesson.id}>
						{lesson.title}
					</option>
				))}
			</select>

			<label className="block mb-2 font-medium">Challenge Type</label>
			<select
				value={type}
				onChange={(e) => setType(e.target.value as typeof type)}
				className="border px-3 py-2 mb-4 w-full rounded"
			>
				{challengeTypes.map((t) => (
					<option key={t} value={t}>
						{t}
					</option>
				))}
			</select>

			<div className="flex gap-2">
				<button
					onClick={handlePreview}
					className="bg-gray-600 text-white px-4 py-2 rounded"
				>
					Preview
				</button>
				<button
					onClick={handleGenerate}
					disabled={loading}
					className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
				>
					{loading ? 'Generating...' : 'Generate'}
				</button>
			</div>

			{message && <p className="mt-4 text-sm text-gray-700">{message}</p>}

			{preview && (
				<div className="mt-6 border rounded p-4 bg-white shadow">
					<h2 className="text-lg font-bold mb-2">Challenge Preview</h2>

					{preview.map((ch, i) => (
						<div key={i} className="mb-4 border-b pb-2">
							<div className="flex items-center justify-between">
								<p className="font-semibold">{ch.question}</p>

								{/* 🗑 Remove Entire Question */}
								<button
									type="button"
									onClick={() =>
										setPreview(
											(prev) => prev?.filter((_, idx) => idx !== i) || null
										)
									}
									className="text-red-600 hover:text-red-800"
								>
									Remove Question ❌
								</button>
							</div>

							{/* ✏️ Editable Order */}
							<label className="block text-sm font-medium mt-2">Order</label>
							<input
								type="number"
								value={ch.order ?? i + 1}
								onChange={(e) => {
									const value = Number(e.target.value)
									setPreview((prev) => {
										if (!prev) return prev
										const updated = [...prev]
										updated[i] = { ...updated[i], order: value }
										return updated
									})
								}}
								className="border rounded px-2 py-1 w-20 mb-2"
							/>

							{ch.hebNiqqud && (
								<p className="text-xl text-right font-serif">{ch.hebNiqqud}</p>
							)}

							{ch.audio && <audio controls src={ch.audio} className="my-2" />}

							{ch.image && (
								<Image src={ch.image} alt="Prompt" className="max-w-xs my-2" />
							)}

							<ul className="list-none ml-0">
								{ch.options.map((opt: any, j: number) => (
									<li
										key={`${opt.text}-${opt.audioSrc ?? opt.imageSrc ?? j}`}
										className="flex items-center justify-between gap-2 py-2 min-h-[40px] transition-all duration-150"
									>
										<div className="flex items-center gap-2">
											<span>
												{opt.text} {opt.correct ? '✅' : ''}
											</span>
											{opt.imageSrc && (
												<Image
													src={opt.imageSrc}
													className="inline h-6"
													alt="option"
												/>
											)}
											{opt.audioSrc && (
												<audio
													controls
													src={opt.audioSrc}
													className="inline h-6"
												/>
											)}
										</div>

										{!opt.correct &&
											ch.options.filter((o: any) => !o.correct).length > 1 && (
												<button
													type="button"
													onClick={() => handleRemoveDistractor(i, j)}
													className="text-red-600 hover:text-red-800"
												>
													<Trash className="h-4 w-4" />
												</button>
											)}
									</li>
								))}
							</ul>
						</div>
					))}

					<button
						onClick={handleGenerate}
						className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
					>
						Commit {preview.length} Challenges
					</button>
				</div>
			)}
		</main>
	)
}
