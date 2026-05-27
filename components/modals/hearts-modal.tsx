'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useHeartsModal } from '@/store/use-hearts-modal'

const getLanguageRoute = (courseId: number | null): string => {
	if (!courseId) return '/curriculum'
	if ([6, 11, 14].includes(courseId)) return '/he/learn'
	if (courseId === 2) return '/es/learn'
	if (courseId === 12) return '/el/learn'
	return '/curriculum'
}

export const HeartsModal = () => {
	const router = useRouter()
	const [isClient, setIsClient] = useState(false)
	const [courseId, setCourseId] = useState<number | null>(null)
	const { isOpen, close } = useHeartsModal()

	useEffect(() => {
		setIsClient(true)
		try {
			const savedProgress = localStorage.getItem('userProgress')
			if (savedProgress) {
				const parsed = JSON.parse(savedProgress)
				setCourseId(parsed.activeCourseId ?? null)
			}
		} catch {
			setCourseId(null)
		}
	}, [])

	if (!isClient) return null

	const learnRoute = getLanguageRoute(courseId)

	const onClick = () => {
		close()
		router.push(learnRoute)
		router.push('/market')
	}

	return (
		<Dialog open={isOpen} onOpenChange={close}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<div className="flex items-center w-full justify-center mb-5">
						<Image src="/mascot_bad.svg" alt="Mascot" height={80} width={80} />
					</div>
					<DialogTitle className="text-center font-bold text-2xl">
						You ran out of hearts!
					</DialogTitle>
					<DialogDescription className="text-center text-base">
						Rewatch previous lessons or retake previous quizzes to gain more
						hearts.
					</DialogDescription>
				</DialogHeader>

				<DialogFooter className="mb-4">
					<div className="flex flex-col gap-y-4 w-full">
						<Button
							variant="primary"
							className="w-full"
							size="lg"
							onClick={onClick}
						>
							Back to lesson menu
						</Button>
						<Button
							variant="primaryOutline"
							className="w-full"
							size="lg"
							onClick={close}
						>
							Let me review this question before I leave
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
