'use client'

import { Trash } from 'lucide-react'
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
	const [lessonId, setLessonId] = useState('')
	const [type, setType] =
		useState<(typeof challengeTypes)[number]>('AUDIO-VISUAL')
	const [loading, setLoading] = useState(false)
	const [message, setMessage] = useState('')
	const router = useRouter()
	const [lessons, setLessons] = useState<Lesson[]>([])
	const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null)
	const notify = useNotify()
	const [preview, setPreview] = useState<any[] | null>(null)

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
			setPreview(data)
		} catch (err) {
			notify('Error generating preview', { type: 'error' })
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetch('/api/lessons')
			.then((res) => res.json())
			.then((data) => setLessons(data))
			.catch((err) =>
				notify(`Error loading lessons: ${err.message}`, { type: 'error' })
			)
	}, [])

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
				}),
				headers: {
					'Content-Type': 'application/json',
				},
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

	return (
		<main className="max-w-xl mx-auto p-6">
			<h1 className="text-2xl font-bold mb-4">Generate Challenges</h1>

			<label className="block mb-2 font-medium">Lesson Number</label>
			<div className="mt-4">
				<label className="block mb-1 font-medium">Lesson</label>
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
			</div>

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
			<button
				onClick={handlePreview}
				className="bg-gray-500 text-white px-4 py-2 rounded ml-2"
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

			{message && <p className="mt-4 text-sm text-gray-700">{message}</p>}
			{preview && (
				<div className="mt-6 border rounded p-4 bg-white shadow">
					<h2 className="text-lg font-bold mb-2">Challenge Preview</h2>

					{preview.map((ch, i) => (
						<div key={i} className="mb-4 border-b pb-2">
							<p>
								<strong>{ch.question}</strong>
							</p>

							{ch.audio && <audio controls src={ch.audio} />}
							{ch.image && (
								<img src={ch.image} alt="Prompt" className="max-w-xs my-2" />
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
												<img src={opt.imageSrc} className="inline h-6" />
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
