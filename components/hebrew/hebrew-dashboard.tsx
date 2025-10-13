'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { updateUserProfile, upsertUserProgress } from '@/actions/user-progress'
import HebrewKeyboard from './hebrew-keyboard'
import { UserProgress } from '../user-progress'
import { Shield } from '../shield'
import { Progress } from '../ui/progress'
import { quests } from '@/constants'
import { GoalDisplayCard } from './hebrew-goal-display-card'
import { SignOutButton, UserButton } from '@clerk/nextjs'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface CourseProgress {
	courseId: number
	courseTitle: string
	courseImage: string
	points: number
	hearts: number
	activeLessonId: number | null
	proficiencyLevel?: string | null
	endingProficiencyLevel?: string | null

	// 🔮 Future expansion
	goalId?: number | null
	goalTitle?: string | null
	goalTarget?: number | null
	tribeId?: number | null
	tribeEngName?: string | null
	tribeHebName?: string | null
	tribeImage?: string | null
}

interface HebrewUserDashboardProps {
	userName: string
	userImageSrc: string
	points: number
	hearts: number
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
	allCourseProgress?: CourseProgress[]
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
	allCourseProgress = [],
}: HebrewUserDashboardProps) {
	const [newName, setNewName] = useState(userName)
	const [avatar, setAvatar] = useState(userImageSrc)
	const [isEditing, setIsEditing] = useState(false)
	const [isPending, startTransition] = useTransition()
	const router = useRouter()

	// 🧮 For unlock logic
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

	const lessonMap = userUnitProgress
		.flatMap((unit: any) => unit.lessons)
		.reduce((map: Record<number, string>, lesson: any) => {
			map[lesson.id] = lesson.lessonNumber
			return map
		}, {})

	const activeCourseProgress = allCourseProgress.find(
		(c) => c.courseId === activeCourse.id
	)
	const activeLesson = activeCourseProgress?.activeLessonId ?? null
	const activeLessonNumber = (activeLesson && lessonMap[activeLesson]) || null

	// const handleAvatarChange = () => {
	// 	const newAvatar = '/new-avatar.svg'
	// 	startTransition(async () => {
	// 		try {
	// 			const updated = await updateUserProfile({ userImageSrc: newAvatar })
	// 			if (updated) setAvatar(updated.userImageSrc)
	// 		} catch (err) {
	// 			console.error('Failed to update avatar:', err)
	// 		}
	// 	})
	// }

	// 🗺️ Course → Path mapping
	const getCoursePath = (courseId: number) => {
		const map: Record<number, string> = {
			6: '/he/learn',
			11: '/he/learn',
			14: '/he/learn',
			13: '/en/learn',
			16: '/en/learn',
		}
		return map[courseId] ?? `/course/${courseId}`
	}

	const handleCourseSwitch = (courseId: number) => {
		if (isPending) return
		startTransition(() => {
			upsertUserProgress(courseId)
				.then(() => {
					toast.success('Course switched!')
					router.push(getCoursePath(courseId))
				})
				.catch(() => toast.error('Something went wrong.'))
		})
	}

	// 🧩 Sort so the current course comes first
	const sortedCourses = [
		...allCourseProgress.filter((c) => c.courseId === activeCourse.id),
		...allCourseProgress.filter((c) => c.courseId !== activeCourse.id),
	]

	return (
		<div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-md p-6 space-y-8">
			{/* Avatar + Username */}
			<div className="flex flex-col items-center justify-center gap-10 w-full mx-auto md:flex-row md:justify-center md:items-center">
				{/* Avatar */}
				<div className="flex flex-col items-center">
					<Image
						src={avatar || '/mascot.svg'}
						alt="User Avatar"
						width={80}
						height={80}
						className="rounded-full border shadow object-cover"
						unoptimized
						onError={(e) => {
							const target = e.target as HTMLImageElement
							target.src = '/mascot.svg'
						}}
					/>
				</div>

				{/* Username */}
				<div className="flex flex-col items-center text-center md:items-center md:text-left">
					<h2 className="text-5xl md:text-6xl font-serif">{newName}</h2>
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

			{/* CURRENT COURSE HIGHLIGHT */}
			{sortedCourses.length > 0 && (
				<div className="p-5 border-2 border-amber-400 bg-gradient-to-br from-yellow-50 to-amber-100 rounded-2xl shadow-lg">
					<div className="flex items-center gap-5 mb-4">
						<Image
							src={activeCourse.imageSrc || '/default-course.png'}
							alt={activeCourse.title}
							width={80}
							height={80}
							className="rounded-md border shadow"
						/>
						<div>
							<h2 className="text-2xl font-bold text-gray-800">
								{activeCourse.title}
							</h2>
							<p className="text-sm text-gray-600">
								Level: {activeCourse.proficiencyLevel} →{' '}
								{activeCourse.endingProficiencyLevel}
							</p>
						</div>
					</div>

					{/* Prominent stats */}
					<div className="flex items-center justify-between">
						<div className="flex flex-col items-center flex-1">
							<Shield lessonNumber={activeLessonNumber || 1} />
							<p className="mt-1 text-sm text-gray-700">
								Current Lesson
								{/* Current Lesson: {activeLessonNumber || '-'} */}
							</p>
						</div>

						<div className="flex flex-col items-center flex-1">
							<div className="flex items-center gap-2">
								<Image
									src="/icons/iconHeart.png"
									alt="Hearts"
									width={36}
									height={36}
								/>
								<p className="text-4xl text-red-600 font-bold">{hearts ?? 0}</p>
							</div>
							<p className="text-gray-700 text-sm mt-1">Hearts</p>
						</div>

						<div className="flex flex-col items-center flex-1">
							<div className="flex items-center gap-2">
								<Image
									src="/icons/iconLightning.png"
									alt="Points"
									width={36}
									height={36}
								/>
								<p className="text-4xl text-amber-600 font-bold">
									{points ?? 0}
								</p>
							</div>
							<p className="text-gray-700 text-sm mt-1">Points</p>
						</div>
					</div>

					<Link
						href={getCoursePath(activeCourse.id)}
						className="block mt-4 text-center bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded-lg transition"
					>
						Continue Learning →
					</Link>
				</div>
			)}

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
			<GoalDisplayCard userUnitProgress={userUnitProgress} />

			{/* OTHER COURSES */}
			{sortedCourses.length > 1 && (
				<div className="mt-8 space-y-4">
					<h2 className="text-xl font-semibold text-center">
						Other Enrolled Courses
					</h2>
					<div className="grid sm:grid-cols-2 gap-4">
						{sortedCourses
							.filter((c) => c.courseId !== activeCourse.id)
							.map((course) => (
								<div
									key={course.courseId}
									className="border rounded-xl bg-white hover:bg-gray-50 shadow-sm p-4 flex flex-col items-center gap-3 transition"
								>
									<Image
										src={course.courseImage || '/default-course.svg'}
										alt={course.courseTitle}
										width={64}
										height={64}
										className="rounded-md border"
									/>
									<h3 className="text-lg font-bold text-gray-800">
										{course.courseTitle}
									</h3>
									<div className="flex items-center gap-3">
										<div className="flex items-center gap-1 text-red-500 font-semibold">
											<Image
												src="/icons/iconHeart.png"
												alt="Hearts"
												width={20}
												height={20}
											/>
											{course.hearts ?? 0}
										</div>
										<div className="flex items-center gap-1 text-amber-600 font-semibold">
											<Image
												src="/icons/iconLightning.png"
												alt="Points"
												width={20}
												height={20}
											/>
											{course.points ?? 0}
										</div>
									</div>

									<button
										onClick={() => handleCourseSwitch(course.courseId)}
										disabled={isPending}
										className="mt-2 text-sm bg-sky-600 hover:bg-sky-700 text-white rounded-lg px-4 py-2 transition disabled:opacity-50"
									>
										Switch to this Course
									</button>
								</div>
							))}
					</div>
				</div>
			)}

			{/* Edit Overlay */}
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

			{/* Account Settings */}
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
