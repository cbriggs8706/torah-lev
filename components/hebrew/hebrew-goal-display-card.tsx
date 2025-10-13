'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Goal {
	lessonNumber?: string | number
	date: string
	mode?: string
}

interface GoalDisplayCardProps {
	userUnitProgress: any[]
}

export function GoalDisplayCard({ userUnitProgress }: GoalDisplayCardProps) {
	const [goal, setGoal] = useState<Goal | null>(null)
	const [courseId, setCourseId] = useState<number | null>(null)

	useEffect(() => {
		function loadData() {
			try {
				const savedGoal = localStorage.getItem('goal')
				if (savedGoal) {
					const parsedGoal = JSON.parse(savedGoal)
					console.log('📘 Loaded goal:', parsedGoal)
					setGoal(parsedGoal)
				} else {
					setGoal(null)
				}

				const savedProgress = localStorage.getItem('userProgress')
				if (savedProgress) {
					const parsed = JSON.parse(savedProgress)
					setCourseId(parsed.activeCourseId ?? null)
				}
			} catch (err) {
				console.error('Failed to parse saved data:', err)
				setCourseId(null)
			}
		}

		loadData()
		window.addEventListener('storage', loadData)
		return () => window.removeEventListener('storage', loadData)
	}, [])

	const learnLink = '/he/learn'

	const formattedDate = goal
		? new Date(goal.date).toLocaleDateString(undefined, {
				month: 'short',
				day: 'numeric',
				year: 'numeric',
		  })
		: null

	return (
		<div className="mt-4 p-4 bg-sky-50 border border-sky-200 rounded-xl shadow-sm">
			<h3 className="text-lg font-semibold text-sky-800 mb-2">My Goal</h3>

			{goal ? (
				<div className="mb-4 text-gray-700 text-lg">
					📖 Complete <strong>Lesson {goal.lessonNumber ?? '?'}</strong> by{' '}
					<strong>{formattedDate}</strong>
				</div>
			) : (
				<p className="text-gray-500 italic mb-4">No goal set yet.</p>
			)}

			<Link href={learnLink}>
				<button className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition">
					{goal ? 'Update Goal' : 'Set Goal'}
				</button>
			</Link>
		</div>
	)
}
