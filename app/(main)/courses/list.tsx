'use client'

import { toast } from 'sonner'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { courses, userProgress } from '@/db/schema'
import { upsertUserProgress } from '@/actions/user-progress'
import { useUserId } from '@/hooks/useUserId' // 👈 import your new hook
import { Card } from './card'

type Props = {
	courses: (typeof courses.$inferSelect)[]
	activeCourseId?: typeof userProgress.$inferSelect.activeCourseId
}

export const List = ({ courses, activeCourseId }: Props) => {
	const router = useRouter()
	const [pending, startTransition] = useTransition()
	const { isGuest, userId, ready } = useUserId()

	// prevent hydration mismatch
	if (!ready) return null

	const getLearnPath = (courseId: number) => {
		if ([6, 11, 14].includes(courseId)) return '/he/learn'
		if ([3, 4, 13, 16, 17, 19].includes(courseId)) return '/en/learn'
		if (courseId === 2) return '/es/learn'
		if (courseId === 12) return '/el/learn'
		return '/courses'
	}

	const onClick = (id: number) => {
		if (pending) return

		const learnPath = getLearnPath(id)

		// 🧩 Guest logic: no DB writes
		if (isGuest || !userId) {
			localStorage.setItem('guestActiveCourseId', String(id))
			document.cookie = `guestActiveCourseId=${id}; path=/; max-age=31536000`
			toast.info('You’re learning as a guest! Progress won’t be saved.')
			return router.push(learnPath)
		}

		// 🧠 Authenticated user logic
		if (id === activeCourseId) {
			return router.push(learnPath)
		}

		startTransition(() => {
			upsertUserProgress(id)
				.then(() => {
					router.push(learnPath)
				})
				.catch(() => toast.error('Something went wrong.'))
		})
	}

	return (
		<div className="pt-6 grid grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-4">
			{courses.map((course) => (
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
	)
}
