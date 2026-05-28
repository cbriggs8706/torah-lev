'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

type StudyGroupJoinButtonProps = {
	studyGroupId: number
	isAuthenticated: boolean
	initiallyJoined: boolean
}

export default function StudyGroupJoinButton({
	studyGroupId,
	isAuthenticated,
	initiallyJoined,
}: StudyGroupJoinButtonProps) {
	const [joined, setJoined] = useState(initiallyJoined)
	const [isJoining, setIsJoining] = useState(false)

	const handleJoin = async () => {
		if (!isAuthenticated) {
			toast.error('Please sign in to join this study group.')
			return
		}

		setIsJoining(true)

		try {
			const response = await fetch(`/api/study-groups/${studyGroupId}/join`, {
				method: 'POST',
			})
			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.error || 'Failed to join study group')
			}

			setJoined(true)
			toast.success(
				data.alreadyMember
					? 'You are already in this study group.'
					: 'You joined the study group.'
			)
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Failed to join study group'
			)
		} finally {
			setIsJoining(false)
		}
	}

	return (
		<Button type="button" onClick={handleJoin} disabled={joined || isJoining}>
			{joined ? 'Joined Study Group' : isJoining ? 'Joining...' : 'Join Study Group'}
		</Button>
	)
}

