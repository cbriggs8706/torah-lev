'use client'

import { toast } from 'sonner'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { upsertUserProgress } from '@/actions/user-progress'
import { useUserId } from '@/hooks/useUserId'
import { Card } from './card'

type Course = {
	id: number
	title: string
	category: string | null
	imageSrc: string
	proficiencyLevel: string | null
	endingProficiencyLevel: string | null
	public: boolean
}

type Props = {
	courses: Course[]
	activeCourseId?: number | null
}

export const List = ({ courses, activeCourseId }: Props) => {
	const router = useRouter()
	const [pending, startTransition] = useTransition()
	const { isGuest, userId, ready } = useUserId()

	if (!ready) return null

	const getLearnPath = (courseId: number) => {
		if ([6, 11, 14, 21].includes(courseId)) return '/he/learn'
		if ([2, 22].includes(courseId)) return '/es/learn'
		if ([12, 20].includes(courseId)) return '/el/learn'
		return '/curriculum'
	}

	const onClick = (id: number) => {
		if (pending) return

		const learnPath = getLearnPath(id)

		if (isGuest || !userId) {
			localStorage.setItem('guestActiveCourseId', String(id))
			document.cookie = `guestActiveCourseId=${id}; path=/; max-age=31536000`
			toast.info('You’re learning as a guest! Progress won’t be saved.')
			return router.push(learnPath)
		}

		if (id === activeCourseId) return router.push(learnPath)

		startTransition(() => {
			upsertUserProgress(id)
				.then(() => router.push(learnPath))
				.catch(() => toast.error('Something went wrong.'))
		})
	}

	// 🧩 Group courses by category
	const grouped = courses.reduce((acc, course) => {
		const category = course.category || 'Uncategorized'
		if (!acc[category]) acc[category] = []
		acc[category].push(course)
		return acc
	}, {} as Record<string, Course[]>)

	// 🧭 Custom category order
	const categoryOrder = [
		'Biblical Hebrew',
		'Modern English',
		'Biblical Greek',
		'Modern Hebrew',
		'Bookclub',
		'Modern Spanish',
	]

	return (
		<div className="space-y-10 pt-6">
			{categoryOrder.map((category) => {
				const categoryCourses = grouped[category]
				if (!categoryCourses?.length) return null

				return (
					<div key={category}>
						<h2 className="text-xl font-semibold mb-4">{category}</h2>
						<div className="grid grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-4">
							{categoryCourses.map((course) => (
								<Card
									key={course.id}
									id={course.id}
									title={course.title}
									imageSrc={course.imageSrc}
									proficiencyLevel={course.proficiencyLevel}
									endingProficiencyLevel={course.endingProficiencyLevel}
									onClick={onClick}
									disabled={pending}
									active={!isGuest && course.id === activeCourseId}
								/>
							))}
						</div>
					</div>
				)
			})}

			{/* 🪶 Optional: Render any uncategorized extras at the end */}
			{Object.entries(grouped).map(([category, categoryCourses]) => {
				if (categoryOrder.includes(category)) return null
				return (
					<div key={category}>
						<h2 className="text-xl font-semibold mb-4">{category}</h2>
						<div className="grid grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-4">
							{categoryCourses.map((course) => (
								<Card
									key={course.id}
									id={course.id}
									title={course.title}
									imageSrc={course.imageSrc}
									proficiencyLevel={course.proficiencyLevel}
									endingProficiencyLevel={course.endingProficiencyLevel}
									onClick={onClick}
									disabled={pending}
									active={!isGuest && course.id === activeCourseId}
								/>
							))}
						</div>
					</div>
				)
			})}
		</div>
	)
}
