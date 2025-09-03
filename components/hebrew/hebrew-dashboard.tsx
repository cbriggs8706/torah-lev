'use client'

import { useEffect, useState, useTransition } from 'react'
import Image from 'next/image'
import { updateUserProfile } from '@/actions/user-progress'
import HebrewKeyboard from './hebrew-keyboard'
import { UserProgress } from '../user-progress'
import { Shield } from '../shield'
import { Progress } from '../ui/progress'
import { quests } from '@/constants'
import { eq } from 'drizzle-orm'
import { SignOutButton, UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { GoalDisplayCard } from './hebrew-goal-display-card'

interface HebrewUserDashboardProps {
	userName: string
	userImageSrc: string
	points: number
	hearts: number
	// TODO fix any typing
	userUnitProgress: any[]
	activeCourse: {
		id: number
		title: string
		imageSrc: string
		proficiencyLevel: string | null
		endingProficiencyLevel: string | null
	}
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
	hearts,
	activeCourse,
	userUnitProgress,
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
						disabled={isPending || lessonValue < 100}
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
					<h2 className="text-6xl font-serif">{newName}</h2>
					<label className="block text-sm font-semibold text-gray-700 mb-1">
						Username
					</label>
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
			<div className="p-3 rounded-lg bg-gray-50 flex flex-row gap-4">
				<Shield lessonNumber={currentLesson || 1} />
				<UserProgress
					activeCourse={activeCourse}
					hearts={hearts}
					points={points}
					hasActiveSubscription={false}
				/>
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
					<p className="text-xs text-gray-500 mt-1">🔒 Unlocks at lesson 10</p>
				</div>
			)}

			{/* Goal Section */}
			<GoalDisplayCard />

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

			<h2 className="text-xl font-semibold mt-6">My Progress</h2>
			{/* Quest Progress */}
			<div className="w-full flex flex-col md:flex-row gap-4">
				<div className="w-full">
					<ul className="w-full">
						{quests.map((quest) => {
							const progress = (points / quest.value) * 100

							return (
								<div
									className="flex items-center w-full p-4 gap-x-4 border-t-2"
									key={quest.title}
								>
									<Image
										src="/points.svg"
										alt="Points"
										width={60}
										height={60}
									/>
									<div className="flex flex-col gap-y-2 w-full">
										<p className="text-neutral-700 text-xl font-bold">
											{quest.title}
										</p>
										<Progress value={progress} className="h-3" />
									</div>
								</div>
							)
						})}
					</ul>
				</div>
				{/* Unit Progress Section */}
				<div className="w-full">
					<h2 className="flex md:hidden text-xl font-semibold mt-10 mb-4 text-neutral-800">
						Unit Progress
					</h2>
					{userUnitProgress.map((unit) => {
						const totalChallenges = unit.lessons.reduce(
							(acc: any, lesson: any) => acc + lesson.challenges.length,
							0
						)

						const completedChallenges = unit.lessons.reduce(
							(acc: any, lesson: any) => {
								return (
									acc +
									lesson.challenges.filter((challenge: any) =>
										challenge.challengeProgress?.some((p: any) => p.completed)
									).length
								)
							},
							0
						)

						const progress =
							totalChallenges > 0
								? (completedChallenges / totalChallenges) * 100
								: 0

						const unitTitle = unit.title.match(/Unit\s*\d+/)?.[0] ?? unit.title

						return (
							<div
								key={unit.id}
								className="flex items-center w-full p-4 gap-x-4 border-t-2"
							>
								<Image
									src="/points.svg"
									alt="Unit Progress"
									width={60}
									height={60}
								/>
								<div className="flex flex-col gap-y-2 w-full">
									<p className="text-neutral-700 text-xl font-bold">
										{unitTitle}
									</p>
									<Progress value={progress} className="h-3" />
								</div>
							</div>
						)
					})}
				</div>{' '}
			</div>

			<div className="mt-6 p-4 bg-gray-50 border rounded-xl shadow-sm">
				<h3 className="text-lg font-semibold text-gray-800 mb-2">
					Account Settings
				</h3>
				<p className="text-sm text-gray-600 mb-4">
					Manage your password, email, and phone using the profile menu. The
					profile menu will not override the avatar and username set above.
				</p>

				<div className="flex flex-wrap items-center gap-4">
					<div className="flex items-center gap-2">
						<UserButton afterSignOutUrl="/" />
						<span className="text-sm text-gray-700">Profile Menu</span>
					</div>

					<SignOutButton>
						<button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
							Sign Out
						</button>
					</SignOutButton>
				</div>
			</div>
		</div>
	)
}
