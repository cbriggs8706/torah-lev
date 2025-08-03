'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { updateUserProfile } from '@/actions/user-progress'
import HebrewKeyboard from './hebrew-keyboard'

interface HebrewUserDashboardProps {
	userName: string
	userImageSrc: string
	points: number
	currentLesson?: string | null
	tribe?: {
		engName: string
		hebName: string
		points: number
		tribeImage: string
	} | null
}

export default function HebrewUserDashboard({
	userName,
	userImageSrc,
	points,
	tribe,
	currentLesson,
}: HebrewUserDashboardProps) {
	const [newName, setNewName] = useState(userName)
	const [avatar, setAvatar] = useState(userImageSrc)
	const [isEditing, setIsEditing] = useState(false)
	const [isPending, startTransition] = useTransition()

	const lessonValue = (() => {
		if (!currentLesson) return 0
		const match = currentLesson.match(/^(\d+)([a-z])?$/i)
		if (!match) return 0
		const base = parseInt(match[1], 10)
		const part = match[2]?.toLowerCase()
		if (part === 'a') return base - 0.25
		if (part === 'b') return base - 0.125
		return base
	})()

	const handleNameSave = () => {
		startTransition(async () => {
			try {
				const updated = await updateUserProfile({ userName: newName })
				if (updated) setNewName(updated.userName)
				setIsEditing(false)
			} catch (err) {
				console.error('Failed to update user:', err)
			}
		})
	}

	const handleAvatarChange = () => {
		const newAvatar = '/new-avatar.svg'
		startTransition(async () => {
			try {
				const updated = await updateUserProfile({ userImageSrc: newAvatar })
				if (updated) setAvatar(updated.userImageSrc)
			} catch (err) {
				console.error('Failed to update avatar:', err)
			}
		})
	}

	return (
		<div className="max-w-md mx-auto bg-white rounded-2xl shadow-md p-6 space-y-6">
			{/* Avatar + Username */}
			<div className="flex items-start gap-10">
				{/* Avatar Section */}
				<div className="flex flex-col items-center">
					<Image
						src={avatar}
						alt="User Avatar"
						width={80}
						height={80}
						className="rounded-full border shadow"
					/>
					<button
						onClick={handleAvatarChange}
						disabled={isPending || lessonValue < 30}
						className="mt-2 text-sm px-3 py-1 rounded-lg border hover:bg-gray-100 disabled:opacity-50"
					>
						Change Avatar
					</button>
					{lessonValue < 30 && (
						<p className="text-xs text-gray-500 text-center mt-1">
							🔒 Unlocks at lesson 30
						</p>
					)}
				</div>

				{/* Username Section */}
				<div className="flex flex-col items-center flex-1">
					<label className="block text-sm font-semibold text-gray-700 mb-1">
						Username
					</label>
					<h2 className="text-6xl font-serif">{newName}</h2>
					<button
						onClick={() => setIsEditing(true)}
						disabled={lessonValue < 20}
						className="mt-2 text-sm px-3 py-1 rounded-lg border hover:bg-gray-100 disabled:opacity-50"
					>
						Edit Username
					</button>
					{lessonValue < 20 && (
						<p className="text-xs text-gray-500 mt-1">
							🔒 Unlocks at lesson 20
						</p>
					)}
				</div>
			</div>

			{/* Points Section */}
			<div className="p-3 rounded-lg bg-gray-50">
				<p className="text-lg font-semibold">My Individual Points: {points}</p>
				<p className="text-lg font-semibold">
					Current Lesson: {currentLesson ?? 'None'}
				</p>
			</div>

			{/* Tribe Section */}
			{tribe ? (
				<div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center gap-4">
					<Image
						src={tribe.tribeImage || '/default-tribe.svg'}
						alt={tribe.engName}
						width={56}
						height={56}
						className="rounded-full border"
					/>
					<div>
						<h3 className="text-lg font-bold text-indigo-700">
							My Tribe:{' '}
							<span className="text-3xl font-serif font-normal">
								{tribe.hebName}
							</span>{' '}
							<span className="text-md">({tribe.engName})</span>
						</h3>
						<p className="text-indigo-600 font-medium">
							Tribe Points: {tribe.points}
						</p>
					</div>
				</div>
			) : (
				<div className="p-3 rounded-lg bg-gray-100 text-gray-500">
					You have not been assigned to a tribe yet.
				</div>
			)}

			{/* ✅ Full-Screen Overlay for Editing */}
			{isEditing && (
				<div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
					<div className="bg-white p-6 rounded-xl shadow-xl max-w-3xl w-full">
						<h3 className="text-xl font-semibold mb-3 text-center">
							Type Your Username
						</h3>
						<input
							type="text"
							value={newName}
							readOnly
							className="border rounded-lg p-2 w-full text-5xl font-serif text-center mb-4"
						/>
						<HebrewKeyboard
							onKeyPress={(key) =>
								setNewName((prev) =>
									key === '\b' ? prev.slice(0, -1) : prev + key
								)
							}
							onEnter={handleNameSave}
						/>
						<div className="flex justify-center gap-4 mt-4">
							<button
								onClick={handleNameSave}
								className="px-4 py-2 bg-green-500 text-white rounded-lg"
							>
								Save
							</button>
							<button
								onClick={() => setIsEditing(false)}
								className="px-4 py-2 bg-gray-200 rounded-lg"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
