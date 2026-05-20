'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { updateUserProfile, upsertUserProgress } from '@/actions/user-progress'
import { createStudyGroup } from '@/actions/study-groups'
import HebrewKeyboard from './hebrew-keyboard'
import { UserProgress } from '../user-progress'
import { Shield } from '../shield'
import { Progress } from '../ui/progress'
import { quests } from '@/constants'
import { GoalDisplayCard } from './hebrew-goal-display-card'
import { signOut, useSession } from '@/components/providers/session-provider'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Button } from '../ui/button'
import { Edit2 } from 'lucide-react'
import { Input } from '../ui/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../ui/select'
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '../ui/dialog'

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
	hebrewName?: string
	userImageSrc: string
	hebrewImageSrc?: string
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
	tribe?: {
		engName: string
		hebName: string
		points: number
		tribeImage: string
		members: any[]
	} | null
	studyGroups?: any[]
	isLeader?: boolean
	allCourseProgress?: CourseProgress[]
}

export default function HebrewUserDashboard({
	userName,
	hebrewName,
	userImageSrc,
	hebrewImageSrc,
	points,
	hearts,
	activeCourse,
	userUnitProgress,
	tribe,
	studyGroups,
	isLeader = false,
	allCourseProgress = [],
}: HebrewUserDashboardProps) {
	const [newName, setNewName] = useState(userName)
	const [avatar, setAvatar] = useState(userImageSrc)
	const [isEditing, setIsEditing] = useState(false)
	const [isPending, startTransition] = useTransition()
	const [isNameDialogOpen, setIsNameDialogOpen] = useState(false)
	const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false)
	const [editingMode, setEditingMode] = useState<'english' | 'hebrew'>(
		'english'
	)
	const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
	const [uploadedFile, setUploadedFile] = useState<File | null>(null)
	const [groupForm, setGroupForm] = useState({
		name: '',
		startDate: '',
		time: '',
		groupType: 'Public' as 'Public' | 'Private' | 'Self-paced',
		level: '',
		organization: '',
		section: '',
		zoomLink: '',
		current: true,
	})

	const router = useRouter()
	const { data: session } = useSession()
	console.log('userImageSrc', userImageSrc)
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

	// 🧮 For unlock logic
	const lessonValue = (() => {
		if (!activeLessonNumber) return 0
		const match = activeLessonNumber.match(/^(\d+)([a-z])?$/i)
		if (!match) return 0
		const base = parseInt(match[1], 10)
		const part = match[2]?.toLowerCase()
		if (part === 'a') return base - 0.25
		if (part === 'b') return base - 0.125
		return base
	})()
	const hebrewNameUnlocked = lessonValue >= 20
	const hebrewAvatarUnlocked = lessonValue >= 100
	const displayName = hebrewNameUnlocked ? newName : userName
	const displayAvatar = hebrewAvatarUnlocked ? avatar : userImageSrc

	const handleNameSave = () => {
		startTransition(async () => {
			try {
				let updated
				if (editingMode === 'hebrew') {
					updated = await updateUserProfile({ hebrewName: newName })
					if (!('guest' in updated)) setNewName(updated.hebrewName)
				} else {
					updated = await updateUserProfile({ userName: newName })
					if (!('guest' in updated)) setNewName(updated.userName)
				}
				setIsNameDialogOpen(false)
			} catch (err) {
				console.error('Failed to update user:', err)
			}
		})
	}

	// 📤 Handle file selection
	const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return
		setUploadedFile(file)
		const previewUrl = URL.createObjectURL(file)
		setAvatarPreview(previewUrl)
	}

	// 💾 Save avatar to backend
	const handleAvatarSave = async () => {
		if (!uploadedFile) return

		try {
			// 1️⃣ Upload to /api/upload
			const formData = new FormData()
			formData.append('file', uploadedFile)

			const res = await fetch('/api/upload', {
				method: 'POST',
				body: formData,
			})

			if (!res.ok) throw new Error('Upload failed')

			const { url } = await res.json()
			console.log('✅ Uploaded image URL:', url)

			// 2️⃣ Update database
			startTransition(async () => {
				console.log('Sending to updateUserProfile:', { userImageSrc: url })

				const updated =
					editingMode === 'hebrew'
						? await updateUserProfile({ hebrewImageSrc: url })
						: await updateUserProfile({ userImageSrc: url })

				if ('guest' in updated) return

				console.log('✅ User updated:', updated)
				console.log(
					'🖼️ Updated image:',
					editingMode === 'hebrew'
						? updated.hebrewImageSrc
						: updated.userImageSrc
				)

				// 3️⃣ Update local UI
				setAvatar(url)
				toast.success('Avatar updated!')
				setAvatarPreview(null)
				setUploadedFile(null)
				setIsAvatarDialogOpen(false)
			})
		} catch (err) {
			console.error('❌ Avatar upload failed:', err)
			toast.error('Failed to upload avatar.')
		}
	}

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
	const cleanSrc = (src?: string) =>
		src?.replace(/\s|\n|\r/g, '')?.trim() || '/mascot.svg'

	const formatStudyGroupDate = (value?: string | Date | null) => {
		if (!value) return '—'
		const date = value instanceof Date ? value : new Date(value)
		if (Number.isNaN(date.getTime())) return '—'
		return date.toLocaleDateString()
	}

	const handleGroupFieldChange = (
		field: keyof typeof groupForm,
		value: string | boolean
	) => {
		setGroupForm((prev) => ({
			...prev,
			[field]: value,
		}))
	}

	const handleCreateStudyGroup = () => {
		startTransition(async () => {
			try {
				const group = await createStudyGroup(groupForm)
				toast.success('Study group created!')
				setGroupForm({
					name: '',
					startDate: '',
					time: '',
					groupType: 'Public' as 'Public' | 'Private' | 'Self-paced',
					level: '',
					organization: '',
					section: '',
					zoomLink: '',
					current: true,
				})
				router.refresh()
				router.push(`/study-group/${group.id}`)
			} catch (error) {
				const message =
					error instanceof Error
						? error.message
						: 'Unable to create study group.'
				toast.error(message)
			}
		})
	}

	return (
		<div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-md p-6 space-y-8">
			{/* Avatar + Username */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
				{/* English Identity Card */}
				<div className="flex flex-col items-center justify-between p-6 bg-white rounded-2xl shadow-md border min-h-[300px]">
					<div className="flex flex-col items-center">
						<Image
							src={userImageSrc || '/mascot.svg'}
							alt="English Avatar"
							width={100}
							height={100}
							className="rounded-full border shadow-md"
						/>
						<h3 className="mt-4 text-2xl font-serif text-gray-800">
							{userName}
						</h3>
					</div>

					{/* --- Action Buttons --- */}
					<div className="flex gap-2 mt-6">
						<Button
							variant="secondaryOutline"
							size="sm"
							onClick={() => {
								setEditingMode('english')
								setIsAvatarDialogOpen(true)
							}}
						>
							Edit Avatar
						</Button>
						<Button
							variant="secondaryOutline"
							size="sm"
							onClick={() => {
								setEditingMode('english')
								setNewName(userName || '')
								setIsNameDialogOpen(true)
							}}
						>
							Edit Username
						</Button>
					</div>
				</div>

				{/* Hebrew Identity Card */}
				<div
					className={`flex flex-col items-center justify-between p-6 rounded-2xl shadow-md border min-h-[300px] transition-all ${
						hebrewNameUnlocked
							? 'bg-sky-50 border-sky-300'
							: 'bg-gray-100 border-gray-200 opacity-60'
					}`}
				>
					<div className="flex flex-col items-center">
						<Image
							src={hebrewImageSrc ? hebrewImageSrc : '/mascot.svg'}
							alt="Hebrew Avatar"
							width={100}
							height={100}
							className="rounded-full border shadow-md"
						/>

						<h3 className="mt-4 text-5xl font-serif text-gray-800">
							{hebrewNameUnlocked ? hebrewName || 'שׁם' : '🔒 Locked'}
						</h3>

						{lessonValue >= 20 && (
							<p className="text-xs text-gray-600 mt-2 mb-2 text-center">
								{lessonValue >= 100
									? 'Avatar unlocked at lesson 100'
									: 'Avatar unlocks at lesson 100'}
							</p>
						)}
					</div>

					{/* --- Action Buttons --- */}
					<div className="flex gap-2 mt-6">
						<Button
							variant="secondaryOutline"
							size="sm"
							disabled={!hebrewAvatarUnlocked}
							onClick={() => {
								if (!hebrewAvatarUnlocked) return
								setEditingMode('hebrew')
								setIsAvatarDialogOpen(true)
							}}
							className={
								!hebrewAvatarUnlocked ? 'opacity-60 cursor-not-allowed' : ''
							}
						>
							Edit Avatar
						</Button>

						<Button
							variant="secondaryOutline"
							size="sm"
							disabled={!hebrewNameUnlocked}
							onClick={() => {
								if (!hebrewNameUnlocked) return
								setEditingMode('hebrew')
								setNewName(hebrewName || '')
								setIsNameDialogOpen(true)
							}}
							className={
								!hebrewNameUnlocked ? 'opacity-60 cursor-not-allowed' : ''
							}
						>
							Edit Hebrew Name
						</Button>
					</div>
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
			{/* Goal Section */}
			<GoalDisplayCard userUnitProgress={userUnitProgress} />
			{/* Tribe Section */}
			{tribe ? (
				<div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200">
					<div className="flex items-center gap-4">
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

					{/* 🧍 Tribe Members */}
					{tribe.members && tribe.members.length > 0 && (
						<div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
							{tribe.members.map((member) => (
								<div
									key={member.userId}
									className="flex flex-col items-center bg-white rounded-xl border p-3 shadow-sm hover:shadow-md transition"
								>
									<Image
										src={member.userImageSrc || '/mascot.svg'}
										alt={member.userName}
										width={60}
										height={60}
										className="rounded-full border object-cover"
									/>
									<p
										className={
											member.hebrewName &&
											member.hebrewName.trim() !== '' &&
											member.hebrewName.trim() !== 'אני'
												? 'font-serif text-2xl text-gray-800 mt-2'
												: 'font-semibold text-md text-gray-800 mt-2'
										}
									>
										{member.hebrewName &&
										member.hebrewName.trim() !== '' &&
										member.hebrewName.trim() !== 'אני'
											? member.hebrewName.trim()
											: member.userName}
									</p>
									<p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
										Lesson: {member.activeLesson || '—'}
									</p>

									<p className="text-xs text-gray-500">
										❤️ {member.hearts} • ⚡ {member.points}
									</p>
								</div>
							))}
						</div>
					)}
				</div>
			) : (
				<div className="p-3 rounded-lg bg-gray-100 text-gray-500">
					You have not been assigned to a tribe yet.
					<p className="text-xs text-gray-500 mt-1">🔒 Unlocks at lesson 10</p>
				</div>
			)}

			{isLeader ? (
				<div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 space-y-4">
					<div className="space-y-1">
						<h2 className="text-2xl font-semibold text-emerald-800">
							Leader
						</h2>
						<p className="text-sm text-emerald-700">
							Create a new study group for your learners.
						</p>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-2">
							<label className="text-sm font-medium text-gray-700">
								Group name
							</label>
							<Input
								value={groupForm.name}
								onChange={(e) =>
									handleGroupFieldChange('name', e.target.value)
								}
								placeholder="Beginner Hebrew Cohort"
								disabled={isPending}
							/>
						</div>
						<div className="space-y-2">
							<label className="text-sm font-medium text-gray-700">
								Start date
							</label>
							<Input
								type="date"
								value={groupForm.startDate}
								onChange={(e) =>
									handleGroupFieldChange('startDate', e.target.value)
								}
								disabled={isPending}
							/>
						</div>
						<div className="space-y-2">
							<label className="text-sm font-medium text-gray-700">Time</label>
							<Input
								value={groupForm.time}
								onChange={(e) =>
									handleGroupFieldChange('time', e.target.value)
								}
								placeholder="Tuesdays at 7:00 PM MT"
								disabled={isPending}
							/>
						</div>
						<div className="space-y-2">
							<label className="text-sm font-medium text-gray-700">Level</label>
							<Input
								value={groupForm.level}
								onChange={(e) =>
									handleGroupFieldChange('level', e.target.value)
								}
								placeholder="Beginner"
								disabled={isPending}
							/>
						</div>
						<div className="space-y-2">
							<label className="text-sm font-medium text-gray-700">Type</label>
							<Select
								value={groupForm.groupType}
								onValueChange={(value) =>
									handleGroupFieldChange(
										'groupType',
										value as 'Public' | 'Private' | 'Self-paced'
									)
								}
								disabled={isPending}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select a type" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="Public">Public</SelectItem>
									<SelectItem value="Private">Private</SelectItem>
									<SelectItem value="Self-paced">Self-paced</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<label className="text-sm font-medium text-gray-700">
								Organization
							</label>
							<Input
								value={groupForm.organization}
								onChange={(e) =>
									handleGroupFieldChange('organization', e.target.value)
								}
								placeholder="Idiom Go"
								disabled={isPending}
							/>
						</div>
						<div className="space-y-2">
							<label className="text-sm font-medium text-gray-700">Section</label>
							<Input
								value={groupForm.section}
								onChange={(e) =>
									handleGroupFieldChange('section', e.target.value)
								}
								placeholder="Section A"
								disabled={isPending}
							/>
						</div>
						<div className="space-y-2">
							<label className="text-sm font-medium text-gray-700">
								Zoom link
							</label>
							<Input
								value={groupForm.zoomLink}
								onChange={(e) =>
									handleGroupFieldChange('zoomLink', e.target.value)
								}
								placeholder="https://zoom.us/j/..."
								disabled={isPending}
							/>
						</div>
					</div>

					<label className="flex items-center gap-2 text-sm text-gray-700">
						<input
							type="checkbox"
							checked={groupForm.current}
							onChange={(e) =>
								handleGroupFieldChange('current', e.target.checked)
							}
							disabled={isPending}
						/>
						Mark as an active study group
					</label>

					<div className="flex justify-end">
						<Button
							variant="secondary"
							onClick={handleCreateStudyGroup}
							disabled={isPending}
						>
							{isPending ? 'Creating...' : 'Create Study Group'}
						</Button>
					</div>
				</div>
			) : null}

			{/* Study Groups Section */}
			{studyGroups && studyGroups.length > 0 ? (
				<div className="p-4 rounded-xl bg-blue-50 border border-blue-200 mt-6 space-y-6">
					{/* 🟦 Current Study Groups */}
					<div>
						<h3 className="text-xl font-semibold text-blue-700 mb-3 text-center">
							My Current Study Groups
						</h3>
						{(() => {
							const currentGroups = studyGroups.filter((g) => g.current)
							if (currentGroups.length === 0)
								return (
									<p className="text-gray-500 text-center">
										You have no active study groups.
									</p>
								)

							const sortedCurrent = [...currentGroups].sort(
								(a, b) => Number(b.isTeacher) - Number(a.isTeacher)
							)

							return (
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									{sortedCurrent.map((group) => (
										<div
											key={group.id}
											className="bg-white border border-blue-100 rounded-xl p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between"
										>
											<div>
												<p className="font-bold text-gray-800">
													{group.name} with {group.organization}
												</p>
												<p className="text-sm text-gray-600 mt-1">
													Level: {group.level}
												</p>
												<p className="text-sm text-gray-600 mt-1">
													Type: {group.groupType}
												</p>
												<p className="text-sm text-gray-600 mt-1">
													Start: {formatStudyGroupDate(group.startDate)}
												</p>
												<p className="text-sm text-gray-600 mt-1">
													Section: {group.section}
												</p>
												<p className="text-sm text-gray-600 mt-1">
													Time: {group.time}
												</p>
												{/* <p className="text-sm text-gray-600 mt-1">
													Level: {group.level} • Section: {group.section} •
													Time: {group.time}
												</p> */}

												{group.isTeacher && (
													<p className="text-xs text-blue-600 font-semibold mt-1">
														You are the instructor
													</p>
												)}
											</div>

											<div className="flex flex-wrap justify-center gap-2 mt-3">
												<Link
													href={`/study-group/${group.id}`}
													className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition"
												>
													View Group
												</Link>
												<Link
													href={`/study-group/${group.id}/messages`}
													className="px-3 py-1 text-sm bg-green-500 hover:bg-green-600 text-white rounded-md transition"
												>
													Message Board
												</Link>
												{group.zoomLink && (
													<a
														href={group.zoomLink}
														target="_blank"
														rel="noopener noreferrer"
														className="px-3 py-1 text-sm bg-indigo-500 hover:bg-indigo-600 text-white rounded-md transition"
													>
														Join Zoom
													</a>
												)}
											</div>
										</div>
									))}
								</div>
							)
						})()}
					</div>

					{/* 🟨 Completed Study Groups */}
					<div>
						<h3 className="text-xl font-semibold text-gray-700 mb-3 text-center">
							My Completed Study Groups
						</h3>
						{(() => {
							const completedGroups = studyGroups.filter((g) => !g.current)
							if (completedGroups.length === 0)
								return (
									<p className="text-gray-500 text-center">
										You have no completed study groups yet.
									</p>
								)

							return (
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									{completedGroups.map((group) => (
										<Link
											key={group.id}
											href={`/study-group/${group.id}`}
											className="bg-gray-100 border border-gray-200 rounded-xl p-4 shadow-sm hover:bg-gray-200 transition block"
										>
											<p className="font-bold text-gray-700">{group.name}</p>
											<p className="text-sm text-gray-600 mt-1">
												Level: {group.level} • Type: {group.groupType}
											</p>
											<p className="text-sm text-gray-600 mt-1">
												Start: {formatStudyGroupDate(group.startDate)}
											</p>
											<p className="text-sm text-gray-600 mt-1">
												Section: {group.section}
											</p>
											<p className="text-xs text-gray-500 mt-1 italic">
												Completed • {group.organization}
											</p>
										</Link>
									))}
								</div>
							)
						})()}
					</div>
				</div>
			) : (
				<div className="p-4 rounded-xl bg-gray-100 text-gray-500 mt-6 text-center">
					You have not been assigned to any study groups yet.
				</div>
			)}

			{/* OTHER COURSES */}
			{/* {sortedCourses.length > 1 && (
				<div className="mt-8 space-y-4">
					<h2 className="text-xl font-semibold text-center">
						My Self-Paced Courses
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
			)} */}

			{/* Edit Overlay */}
			{isEditing && (
				<div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
					<div className="bg-white p-6 rounded-xl shadow-xl max-w-3xl w-full">
						<h3 className="text-xl font-semibold mb-3 text-center">
							{hebrewNameUnlocked
								? 'Type Your Hebrew Name'
								: 'Type Your Username'}
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
							<Button onClick={handleNameSave} variant="secondary">
								Save
							</Button>
							<Button
								onClick={() => setIsEditing(false)}
								variant="secondaryOutline"
							>
								Cancel
							</Button>
						</div>
					</div>
				</div>
			)}

			{/* Account Settings */}
			{/* <div className="mt-6 p-4 bg-gray-50 border rounded-xl shadow-sm">
				<h3 className="text-lg font-semibold text-gray-800 mb-2">
					Account Settings
				</h3>
				<p className="text-sm text-gray-600 mb-4">
					Manage your password, email, and phone using the profile menu. The
					profile menu will not override the avatar and username set above.
				</p>

				<div className="flex flex-wrap items-center gap-4">
					<div className="flex items-center gap-2">
						<Image
							src={session?.user?.image || '/mascot.svg'}
							alt="Profile"
							width={40}
							height={40}
							className="rounded-full border"
						/>
						<span className="text-sm text-gray-700">
							{session?.user?.name || 'My Account'}
						</span>
					</div>

					<button
						onClick={() => signOut({ callbackUrl: '/' })}
						className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
					>
						Sign Out
					</button>
				</div>
			</div> */}
			<Dialog open={isNameDialogOpen} onOpenChange={setIsNameDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{editingMode === 'hebrew'
								? 'Edit Hebrew Name'
								: 'Edit English Name'}
						</DialogTitle>
					</DialogHeader>

					<div className="mt-4">
						<input
							type="text"
							value={newName}
							onChange={(e) => setNewName(e.target.value)}
							className="w-full border rounded-lg p-3 text-3xl text-center font-serif"
							placeholder={
								editingMode === 'hebrew'
									? 'Enter Hebrew name'
									: 'Enter English name'
							}
						/>
					</div>

					{editingMode === 'hebrew' && (
						<HebrewKeyboard
							onKeyPress={(key) =>
								setNewName((prev) =>
									key === '\b' ? prev.slice(0, -1) : prev + key
								)
							}
							onEnter={handleNameSave}
						/>
					)}

					<DialogFooter className="mt-4 flex justify-end gap-2">
						<Button
							variant="secondaryOutline"
							onClick={() => setIsNameDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button onClick={handleNameSave} variant="secondary">
							Save
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Avatar Edit Dialog */}
			<Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{editingMode === 'hebrew'
								? 'Edit Hebrew Avatar'
								: 'Edit English Avatar'}
						</DialogTitle>
					</DialogHeader>

					<div className="flex flex-col items-center mt-4 space-y-4">
						{/* 🖼️ Avatar Preview */}
						<Image
							src={
								avatarPreview ||
								(editingMode === 'hebrew'
									? hebrewImageSrc || '/mascot.svg'
									: userImageSrc || '/mascot.svg')
							}
							alt="Current Avatar"
							width={120}
							height={120}
							className="rounded-full border shadow-md object-cover"
						/>

						{/* 📁 File Input */}
						<input
							type="file"
							accept="image/*"
							onChange={(e) => handleAvatarUpload(e)}
							className="text-sm text-gray-600"
						/>

						{/* 💾 Save Button */}
						<Button
							onClick={handleAvatarSave}
							disabled={!avatarPreview}
							variant="primary"
						>
							Save Avatar
						</Button>
					</div>

					<DialogFooter className="mt-4 flex justify-end">
						<Button
							variant="primaryOutline"
							onClick={() => setIsAvatarDialogOpen(false)}
						>
							Close
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
