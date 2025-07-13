'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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

	const handleGenerate = async () => {
		if (!lessonId || isNaN(Number(lessonId))) {
			setMessage('Please enter a valid lesson number.')
			return
		}

		setLoading(true)
		setMessage('')
		try {
			const res = await fetch('/api/generate-challenges', {
				method: 'POST',
				body: JSON.stringify({
					lessonId: Number(lessonId),
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

	return (
		<main className="max-w-xl mx-auto p-6">
			<h1 className="text-2xl font-bold mb-4">Generate Challenges</h1>

			<label className="block mb-2 font-medium">Lesson Number</label>
			<input
				type="number"
				value={lessonId}
				onChange={(e) => setLessonId(e.target.value)}
				className="border px-3 py-2 mb-4 w-full rounded"
			/>

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
				onClick={handleGenerate}
				disabled={loading}
				className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
			>
				{loading ? 'Generating...' : 'Generate'}
			</button>

			{message && <p className="mt-4 text-sm text-gray-700">{message}</p>}
		</main>
	)
}
