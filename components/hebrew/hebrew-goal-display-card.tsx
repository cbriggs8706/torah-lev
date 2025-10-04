'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Goal {
	lesson: string
	date: string
}

export function GoalDisplayCard() {
	const [goal, setGoal] = useState<Goal | null>(null)

	// ✅ Load goal from localStorage and listen for updates
	useEffect(() => {
		function loadGoal() {
			const saved = localStorage.getItem('goal')
			setGoal(saved ? JSON.parse(saved) : null)
		}

		loadGoal()
		window.addEventListener('storage', loadGoal)
		return () => window.removeEventListener('storage', loadGoal)
	}, [])

	return (
		<div className="mt-4 p-4 bg-sky-50 border border-sky-200 rounded-xl shadow-sm">
			<h3 className="text-lg font-semibold text-sky-800 mb-2">My Goal</h3>

			{goal ? (
				<div className="mb-4">
					<p className="text-gray-700 text-lg">
						📖 Complete <strong>{goal.lesson}</strong> by{' '}
						<strong>{new Date(goal.date).toLocaleDateString()}</strong>
					</p>
				</div>
			) : (
				<p className="text-gray-500 italic mb-4">No goal set yet.</p>
			)}

			<Link href="/learn">
				<button className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition">
					{goal ? 'Update Goal' : 'Set Goal'}
				</button>
			</Link>
		</div>
	)
}
