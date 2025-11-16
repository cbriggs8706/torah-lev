'use client'

import { useState } from 'react'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function JoinCourseModal({ locale }: { locale: string }) {
	const [code, setCode] = useState('')
	const [loading, setLoading] = useState(false)
	const router = useRouter()

	async function handleJoin() {
		setLoading(true)

		// Step 1 — Lookup course by its courseCode
		const lookupRes = await fetch(`/api/courses/find-by-code`, {
			method: 'POST',
			body: JSON.stringify({ code }),
		})

		if (!lookupRes.ok) {
			toast.error('Invalid course code.')
			setLoading(false)
			return
		}

		const { courseId } = await lookupRes.json()

		// Step 2 — Now enroll using your new enroll-with-code route
		const enrollRes = await fetch(`/api/courses/${courseId}/enroll-with-code`, {
			method: 'POST',
			body: JSON.stringify({ code }),
		})

		const data = await enrollRes.json()

		if (!enrollRes.ok) {
			const err = await enrollRes.json()
			toast.error(err.error || 'Could not join course.')
			setLoading(false)
			return
		}

		toast.success(data.message || 'Successfully joined the course!')
		setLoading(false)
		router.refresh()
	}

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button className="mb-4 w-1/2">Join Course by Code</Button>
			</DialogTrigger>

			<DialogContent>
				<DialogHeader>
					<DialogTitle>Join a Course</DialogTitle>
				</DialogHeader>

				<div className="space-y-3">
					<Input
						placeholder="Enter Course Code"
						value={code}
						onChange={(e) => setCode(e.target.value)}
					/>

					<Button
						className="w-full"
						disabled={!code || loading}
						onClick={handleJoin}
					>
						{loading ? 'Joining...' : 'Join'}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	)
}
