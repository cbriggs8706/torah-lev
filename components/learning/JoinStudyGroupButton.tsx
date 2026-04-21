'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface Props {
	studyGroupId: string
	joined: boolean
}

export function JoinStudyGroupButton({ studyGroupId, joined }: Props) {
	const router = useRouter()
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [isJoined, setIsJoined] = useState(joined)

	async function join() {
		setSaving(true)
		setError(null)

		try {
			const res = await fetch('/api/learning/study-groups/join', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ studyGroupId }),
			})

			if (!res.ok) {
				const body = await res.json().catch(() => null)
				throw new Error(body?.error || 'Unable to join study group')
			}

			setIsJoined(true)
			router.refresh()
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Unable to join study group')
		} finally {
			setSaving(false)
		}
	}

	return (
		<div className="space-y-2">
			<Button
				type="button"
				onClick={join}
				disabled={saving || isJoined}
				variant={isJoined ? 'outline' : 'default'}
			>
				{saving ? 'Joining...' : isJoined ? 'Joined' : 'Join study group'}
			</Button>
			{error ? <p className="text-sm text-destructive">{error}</p> : null}
		</div>
	)
}
