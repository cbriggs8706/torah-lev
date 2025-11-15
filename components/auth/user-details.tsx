'use client'

import { useEffect, useState, useTransition } from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { updateUserProfile } from '@/app/actions/update-user-profile'
import { UpdateUserProfileInput } from '@/types/user'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

interface UserDetailsProps {
	currentImage?: string | null
	currentName?: string | null
	currentUsername?: string | null
}

export default function UserDetails({ currentImage }: UserDetailsProps) {
	const [name, setName] = useState('')
	const [username, setUsername] = useState('')

	const { data: session } = useSession()

	const [isOpen, setIsOpen] = useState(false)
	const [preview, setPreview] = useState<string | null>(null)
	const [file, setFile] = useState<File | null>(null)

	const [isPending, startTransition] = useTransition()
	useEffect(() => {
		if (isOpen && session?.user) {
			setName(session.user.name ?? '')
			setUsername(session.user.username ?? '')
		}
	}, [isOpen, session])

	// --------------------------
	// FILE SELECTION
	// --------------------------
	const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selected = e.target.files?.[0]
		if (!selected) return

		setFile(selected)
		setPreview(URL.createObjectURL(selected))
	}

	// --------------------------
	// SAVE CHANGES
	// --------------------------
	const onSave = () => {
		startTransition(async () => {
			try {
				let uploadedUrl: string | undefined = undefined

				// --------------------------
				// 1. Upload avatar if selected
				// --------------------------
				if (file) {
					const form = new FormData()
					form.append('file', file)

					const uploadRes = await fetch('/api/upload', {
						method: 'POST',
						body: form,
					})

					if (!uploadRes.ok) throw new Error('Upload failed')
					const { url } = await uploadRes.json()
					uploadedUrl = url
				}

				// --------------------------
				// 2. Update profile (name, username, image)
				// --------------------------
				const payload: UpdateUserProfileInput = {}

				if (name && name !== session?.user?.name) {
					payload.name = name
				}

				if (username && username !== session?.user?.username) {
					payload.username = username
				}

				if (uploadedUrl) {
					payload.image = uploadedUrl
				}

				if (Object.keys(payload).length > 0) {
					await updateUserProfile(payload)
				}

				toast.success('Profile updated!')
				setIsOpen(false)
				setPreview(null)
				setFile(null)
			} catch (err) {
				console.error(err)
				toast.error('Failed to update profile')
			}
		})
	}

	return (
		<>
			<Card className="w-full max-w-md mx-auto shadow-md border">
				<CardHeader className="flex flex-row items-center gap-4">
					<Avatar className="h-16 w-16">
						<AvatarImage
							src={preview || currentImage || session?.user?.image || undefined}
						/>
						<AvatarFallback>
							{session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
						</AvatarFallback>
					</Avatar>

					<div>
						<CardTitle className="text-xl">
							{session?.user?.name || 'No Name'}
						</CardTitle>
						<p className="text-sm text-muted-foreground">
							@{session?.user?.username || 'username not chosen'}
						</p>
					</div>
				</CardHeader>
				<CardContent>
					<Button
						variant="secondary"
						className="w-full"
						onClick={() => setIsOpen(true)}
					>
						Edit Profile
					</Button>
				</CardContent>
			</Card>

			{/* ---- DIALOG ---- */}
			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Your Profile</DialogTitle>
					</DialogHeader>

					<div className="space-y-6">
						{/* ------------------ */}
						{/* AVATAR PREVIEW     */}
						{/* ------------------ */}
						<div className="flex flex-col items-center gap-4">
							<Image
								src={
									preview ||
									currentImage ||
									session?.user?.image ||
									'/mascot.svg'
								}
								alt="Preview"
								width={120}
								height={120}
								className="rounded-full border shadow-sm object-cover"
							/>

							<input type="file" accept="image/*" onChange={onSelectFile} />

							<p className="text-sm text-muted-foreground">
								Upload a new avatar (optional)
							</p>
						</div>

						{/* ------------------ */}
						{/* NAME INPUT         */}
						{/* ------------------ */}
						<div>
							<label className="text-sm font-medium">Name</label>
							<Input
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Your full name"
							/>
						</div>

						{/* ------------------ */}
						{/* USERNAME INPUT     */}
						{/* ------------------ */}
						<div>
							<label className="text-sm font-medium">Username</label>
							<Input
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								placeholder="Your username"
							/>
						</div>

						{/* ------------------ */}
						{/* SAVE BUTTON        */}
						{/* ------------------ */}
						<Button
							variant="default"
							onClick={onSave}
							disabled={isPending}
							className="w-full"
						>
							{isPending ? 'Saving...' : 'Save Changes'}
						</Button>
					</div>

					<DialogFooter>
						<Button variant="secondary" onClick={() => setIsOpen(false)}>
							Cancel
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}
