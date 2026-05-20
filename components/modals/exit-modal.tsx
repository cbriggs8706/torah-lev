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
import { useExitModal } from '@/store/use-exit-modal'

const getLanguageRoute = (courseId: number | null): string => {
	if (!courseId) return '/courses'
	if ([6, 11, 14].includes(courseId)) return '/he/learn'
	if (courseId === 2) return '/es/learn'
	if (courseId === 12) return '/el/learn'
	return '/courses'
}

export const ExitModal = () => {
	const router = useRouter()
	const [isClient, setIsClient] = useState(false)
	const [courseId, setCourseId] = useState<number | null>(null)
	const { isOpen, close } = useExitModal()

	useEffect(() => {
		setIsClient(true)

		// Re-read from localStorage whenever the modal opens
		if (isOpen) {
			try {
				const savedProgress = localStorage.getItem('userProgress')
				console.log('♻️ Reloaded userProgress on open:', savedProgress)
				if (savedProgress) {
					const parsed = JSON.parse(savedProgress)
					setCourseId(parsed.activeCourseId ?? null)
				} else {
					setCourseId(null)
				}
			} catch (err) {
				console.error('❌ Failed to parse userProgress:', err)
				setCourseId(null)
			}
		}
	}, [isOpen])

	if (!isClient) return null

	const learnRoute = getLanguageRoute(courseId)

	return (
		<Dialog open={isOpen} onOpenChange={close}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<div className="flex items-center w-full justify-center mb-5">
						<Image src="/mascot_sad.svg" alt="Mascot" height={80} width={80} />
					</div>
					<DialogTitle className="text-center font-bold text-2xl">
						Wait, don&apos;t go!
					</DialogTitle>
					<DialogDescription className="text-center text-base">
						You&apos;re about to leave the lesson. Are you sure?
					</DialogDescription>
				</DialogHeader>

				<DialogFooter className="mb-4">
					<div className="flex flex-col gap-y-4 w-full">
						<Button
							variant="primary"
							className="w-full"
							size="lg"
							onClick={close}
						>
							Keep learning
						</Button>
						<Button
							variant="dangerOutline"
							className="w-full"
							size="lg"
							onClick={() => {
								close()
								router.push(learnRoute)
							}}
						>
							End session
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
