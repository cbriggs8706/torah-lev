'use client'

import { useEffect, useEffectEvent, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Check, ChevronsUpDown } from 'lucide-react'

import { AvatarImageSafe } from '@/components/avatar-image-safe'
import StudyGroupCoursesSection from '@/components/study-group/study-group-courses-section'
import StudyGroupScheduleCuration from '@/components/study-group/study-group-schedule-curation'
import { Button } from '@/components/ui/button'
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'
import { normalizeDraftActivities } from '@/app/admin/public-courses/shared'
import { cn } from '@/lib/utils'

type GroupCourse = {
	id: number
	name: string
	imageUrl: string
	startDate: string | Date | null
	endDate: string | Date | null
}

type ScheduleEvent = {
	id: number
	classDate: string | Date
	title: string | null
	notes?: string | null
	studyGroupCourseId: number | null
	groupCourseName: string | null
	platformCourseId: number | null
	platformCourseTitle: string | null
	lessonId: number | null
	lessonTitle: string | null
	lessonNumber: string | null
}

type PlatformCourse = {
	id: number
	title: string
}

type LessonOption = {
	id: number
	title: string
	lessonNumber?: string | number
	unitTitle?: string
	unitOrder?: number
}

type MemberOption = {
	userId: string
	userName: string
	email: string | null
	userImageSrc: string
}

type StudyGroupSettingsProps = {
	studyGroupId: number
	initialCourses: GroupCourse[]
	initialEvents: ScheduleEvent[]
}

function formatDateTime(value: string | Date) {
	const parsed = value instanceof Date ? value : new Date(value)
	if (Number.isNaN(parsed.getTime())) return 'Invalid date'

	return parsed.toLocaleString(undefined, {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
	})
}

export default function StudyGroupSettings({
	studyGroupId,
	initialCourses,
	initialEvents,
}: StudyGroupSettingsProps) {
	const [courses, setCourses] = useState(initialCourses)
	const [events, setEvents] = useState(initialEvents)
	const [members, setMembers] = useState<MemberOption[]>([])
	const [availableUsers, setAvailableUsers] = useState<MemberOption[]>([])
	const [availableCourses, setAvailableCourses] = useState<PlatformCourse[]>([])
	const [sessionType, setSessionType] = useState<'lesson' | 'custom'>('lesson')
	const [selectedGroupCourseId, setSelectedGroupCourseId] = useState('')
	const [selectedPlatformCourseId, setSelectedPlatformCourseId] = useState('')
	const [selectedUserId, setSelectedUserId] = useState('')
	const [memberPickerOpen, setMemberPickerOpen] = useState(false)
	const [classDate, setClassDate] = useState('')
	const [customTitle, setCustomTitle] = useState('')
	const [lessonId, setLessonId] = useState('')
	const [notes, setNotes] = useState('')
	const [lessons, setLessons] = useState<LessonOption[]>([])
	const [loadingLessons, setLoadingLessons] = useState(false)
	const [loadingMembers, setLoadingMembers] = useState(false)
	const [isAddingMember, setIsAddingMember] = useState(false)
	const [isSubmitting, setIsSubmitting] = useState(false)

	useEffect(() => {
		setCourses(initialCourses)
	}, [initialCourses])

	const loadMembers = useEffectEvent(async () => {
		setLoadingMembers(true)

		try {
			const response = await fetch(`/api/study-groups/${studyGroupId}/members`)
			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.error || 'Failed to load study group members')
			}

			setMembers(data.members ?? [])
			setAvailableUsers(data.availableUsers ?? [])
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: 'Could not load study group members.'
			)
		} finally {
			setLoadingMembers(false)
		}
	})

	useEffect(() => {
		void loadMembers()
	}, [studyGroupId])

	useEffect(() => {
		void fetch(`/api/study-groups/${studyGroupId}/courses`)
			.then(async (response) => {
				if (!response.ok) {
					throw new Error('Failed to load group courses')
				}
				return response.json()
			})
			.then((data: { courses: GroupCourse[] }) => {
				setCourses(data.courses ?? [])
			})
			.catch(() => {
				toast.error('Could not load this study group’s courses.')
			})
	}, [studyGroupId])

	useEffect(() => {
		void fetch('/api/public/curriculum?sort=["title","ASC"]&range=[0,199]')
			.then(async (response) => {
				if (!response.ok) {
					throw new Error('Failed to load courses')
				}
				return response.json()
			})
			.then((data: PlatformCourse[]) => setAvailableCourses(data))
			.catch(() => {
				toast.error('Could not load real courses.')
			})
	}, [])

	useEffect(() => {
		if (!selectedPlatformCourseId) {
			setLessons([])
			setLessonId('')
			return
		}

		setLoadingLessons(true)
		void fetch(`/api/public/curriculum/${selectedPlatformCourseId}/lessons`)
			.then(async (response) => {
				if (!response.ok) {
					throw new Error('Failed to load lessons')
				}
				return response.json()
			})
			.then((data: LessonOption[]) => {
				setLessons(data)
			})
			.catch(() => {
				setLessons([])
				setLessonId('')
				toast.error('Could not load lessons for that course.')
			})
			.finally(() => setLoadingLessons(false))
	}, [selectedPlatformCourseId])

	const resetEventForm = () => {
		setSessionType('lesson')
		setSelectedGroupCourseId('')
		setSelectedPlatformCourseId('')
		setClassDate('')
		setCustomTitle('')
		setLessonId('')
		setNotes('')
		setLessons([])
	}

	const selectedAvailableUser =
		availableUsers.find((user) => user.userId === selectedUserId) ?? null

	const handleAddMember = async () => {
		if (!selectedUserId) {
			toast.error('Choose a student to add.')
			return
		}

		setIsAddingMember(true)

		try {
			const response = await fetch(`/api/study-groups/${studyGroupId}/members`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ userId: selectedUserId }),
			})
			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.error || 'Failed to add student')
			}

			setMembers(data.members ?? [])
			setAvailableUsers(data.availableUsers ?? [])
			setSelectedUserId('')
			toast.success('Student added to the study group.')
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Failed to add student'
			)
		} finally {
			setIsAddingMember(false)
		}
	}

	const handleCreateEvent = async () => {
		if (!classDate) {
			toast.error('Class date and time are required.')
			return
		}

		if (!selectedGroupCourseId) {
			toast.error('Choose a group course first.')
			return
		}

		if (sessionType === 'lesson' && !lessonId) {
			toast.error('Choose a lesson for this class.')
			return
		}

		if (sessionType === 'lesson' && !selectedPlatformCourseId) {
			toast.error('Choose the source course for this lesson.')
			return
		}

		if (sessionType === 'custom' && !customTitle.trim()) {
			toast.error('Enter a class name.')
			return
		}

		setIsSubmitting(true)

		try {
			const selectedLessonDetails =
				sessionType === 'lesson'
					? lessons.find((lesson) => lesson.id === Number(lessonId))
					: null
			const response = await fetch(`/api/study-groups/${studyGroupId}/schedule`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					classDate: new Date(classDate).toISOString(),
					studyGroupCourseId: Number(selectedGroupCourseId),
					sessionType,
					title: sessionType === 'custom' ? customTitle : null,
					platformCourseId:
						sessionType === 'lesson'
							? Number(selectedPlatformCourseId)
							: null,
					lessonId: sessionType === 'lesson' ? Number(lessonId) : null,
					notes,
					activities:
						sessionType === 'lesson' && selectedLessonDetails
							? normalizeDraftActivities(
									[],
									selectedLessonDetails.lessonNumber ?? null,
								).map((activity, index) => ({
									activityKey: activity.activityKey,
									order: index + 1,
									isEnabled: activity.isEnabled,
									filterConfig: activity.filterConfig,
								}))
							: undefined,
				}),
			})
			const result = await response.json()

			if (!response.ok) {
				throw new Error(result.error || 'Failed to create event')
			}

			setEvents((current) => [result.event, ...current])
			resetEventForm()
			toast.success('Class event created.')
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Failed to create event'
			)
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<div className="w-full max-w-4xl space-y-6">
			<div className="rounded-xl border bg-white p-5 shadow-sm">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h2 className="text-xl font-semibold text-slate-900">Group Settings</h2>
						<p className="text-sm text-slate-600">
							Manage course cards and build the class schedule students will use.
						</p>
					</div>
					<Link href={`/study-group/${studyGroupId}`}>
						<Button variant="ghost">Back to Group</Button>
					</Link>
				</div>
			</div>

			<div className="rounded-xl border bg-white p-5 shadow-sm space-y-5">
				<div className="space-y-1">
					<h2 className="text-xl font-semibold text-slate-900">Students</h2>
					<p className="text-sm text-slate-600">
						Add students from the available user list to this study group.
					</p>
				</div>

				<div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 space-y-4">
					<div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
						<Popover open={memberPickerOpen} onOpenChange={setMemberPickerOpen}>
							<PopoverTrigger asChild>
								<Button
									type="button"
									variant="ghost"
									className="w-full justify-between border border-input bg-white px-3 normal-case tracking-normal"
									disabled={loadingMembers || isAddingMember || availableUsers.length === 0}
								>
									<span className="truncate">
										{selectedAvailableUser
											? selectedAvailableUser.userName
											: loadingMembers
											? 'Loading available users...'
											: availableUsers.length > 0
											? 'Select a student'
											: 'No available users'}
									</span>
									<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
								<Command>
									<CommandInput placeholder="Search users..." />
									<CommandList>
										<CommandEmpty>No users found.</CommandEmpty>
										<CommandGroup>
											{availableUsers.map((user) => (
												<CommandItem
													key={user.userId}
													value={`${user.userName} ${user.email ?? ''}`}
													onSelect={() => {
														setSelectedUserId(user.userId)
														setMemberPickerOpen(false)
													}}
												>
													<div className="flex min-w-0 flex-1 flex-col">
														<span className="truncate font-medium">
															{user.userName}
														</span>
														{user.email ? (
															<span className="truncate text-xs text-slate-500">
																{user.email}
															</span>
														) : null}
													</div>
													<Check
														className={cn(
															'ml-2 h-4 w-4 shrink-0',
															selectedUserId === user.userId
																? 'opacity-100'
																: 'opacity-0'
														)}
													/>
												</CommandItem>
											))}
										</CommandGroup>
									</CommandList>
								</Command>
							</PopoverContent>
						</Popover>

						<Button
							type="button"
							onClick={handleAddMember}
							disabled={!selectedUserId || isAddingMember}
						>
							{isAddingMember ? 'Adding Student...' : 'Add Student'}
						</Button>
					</div>
				</div>

				<div className="space-y-3">
					<h3 className="text-base font-semibold text-slate-900">Current students</h3>
					{members.length > 0 ? (
						<div className="grid gap-3 sm:grid-cols-2">
							{members.map((member) => (
								<div
									key={member.userId}
									className="flex items-center gap-3 rounded-xl border bg-slate-50 p-3"
								>
									<AvatarImageSafe
										src={member.userImageSrc}
										alt={member.userName}
										size={44}
									/>
									<div className="min-w-0">
										<p className="truncate font-semibold text-slate-900">
											{member.userName}
										</p>
										<p className="truncate text-sm text-slate-600">
											{member.email || 'No email available'}
										</p>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="rounded-xl border border-dashed p-6 text-sm text-slate-600">
							No students have been added to this study group yet.
						</div>
					)}
				</div>
			</div>

			<StudyGroupCoursesSection
				studyGroupId={studyGroupId}
				initialCourses={courses}
				canManage
				onCoursesChange={setCourses}
			/>

			<div className="rounded-xl border bg-white p-5 shadow-sm space-y-5">
				<div className="space-y-1">
					<h2 className="text-xl font-semibold text-slate-900">Semester Schedule</h2>
					<p className="text-sm text-slate-600">
						Create class meetings that either point to a lesson or use a custom
						class name.
					</p>
				</div>

				<div className="rounded-xl border border-sky-100 bg-sky-50 p-4 space-y-4">
					<div className="space-y-2">
						<Label htmlFor="study-group-event-course">Group course</Label>
						<select
							id="study-group-event-course"
							value={selectedGroupCourseId}
							onChange={(event) => setSelectedGroupCourseId(event.target.value)}
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
							disabled={isSubmitting}
						>
							<option value="">Select a group course</option>
							{courses.map((course) => (
								<option key={course.id} value={course.id}>
									{course.name}
								</option>
							))}
						</select>
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="study-group-event-date">Date and time</Label>
							<Input
								id="study-group-event-date"
								type="datetime-local"
								value={classDate}
								onChange={(event) => setClassDate(event.target.value)}
								disabled={isSubmitting}
							/>
						</div>
						<div className="space-y-2">
							<Label>Event type</Label>
							<div className="flex gap-2">
								<Button
									type="button"
									variant={sessionType === 'lesson' ? 'default' : 'ghost'}
									onClick={() => setSessionType('lesson')}
									disabled={isSubmitting}
								>
									Lesson
								</Button>
								<Button
									type="button"
									variant={sessionType === 'custom' ? 'default' : 'ghost'}
									onClick={() => setSessionType('custom')}
									disabled={isSubmitting}
								>
									Custom name
								</Button>
							</div>
						</div>
					</div>

					{sessionType === 'lesson' ? (
						<>
							<div className="space-y-2">
								<Label htmlFor="study-group-event-platform-course">
									Source course
								</Label>
								<select
									id="study-group-event-platform-course"
									value={selectedPlatformCourseId}
									onChange={(event) =>
										setSelectedPlatformCourseId(event.target.value)
									}
									className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
									disabled={isSubmitting}
								>
									<option value="">Select a course</option>
									{availableCourses.map((course) => (
										<option key={course.id} value={course.id}>
											{course.title}
										</option>
									))}
								</select>
							</div>

							<div className="space-y-2">
								<Label htmlFor="study-group-event-lesson">Lesson</Label>
								<select
									id="study-group-event-lesson"
									value={lessonId}
									onChange={(event) => setLessonId(event.target.value)}
									className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
									disabled={isSubmitting || loadingLessons || !selectedPlatformCourseId}
								>
									<option value="">
										{selectedPlatformCourseId
											? loadingLessons
												? 'Loading lessons...'
												: 'Select a lesson'
											: 'Select a source course first'}
									</option>
									{lessons.map((lesson) => (
										<option key={lesson.id} value={lesson.id}>
											{[
												lesson.unitOrder ? `Unit ${lesson.unitOrder}` : null,
												lesson.unitTitle ?? null,
												lesson.lessonNumber
													? `Lesson ${lesson.lessonNumber}`
													: null,
												lesson.title,
											]
												.filter(Boolean)
												.join(' - ')}
										</option>
									))}
								</select>
							</div>
						</>
					) : (
						<div className="space-y-2">
							<Label htmlFor="study-group-event-title">Class name</Label>
							<Input
								id="study-group-event-title"
								value={customTitle}
								onChange={(event) => setCustomTitle(event.target.value)}
								placeholder="Review day"
								disabled={isSubmitting}
							/>
						</div>
					)}

					<div className="space-y-2">
						<Label htmlFor="study-group-event-notes">Notes (optional)</Label>
						<textarea
							id="study-group-event-notes"
							value={notes}
							onChange={(event) => setNotes(event.target.value)}
							rows={3}
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
							disabled={isSubmitting}
						/>
					</div>

					<Button type="button" onClick={handleCreateEvent} disabled={isSubmitting}>
						{isSubmitting ? 'Saving Event...' : 'Add Event'}
					</Button>
				</div>

				<div className="space-y-3">
					<h3 className="text-base font-semibold text-slate-900">Scheduled classes</h3>
					{events.length > 0 ? (
						<div className="space-y-3">
							{events.map((event) => (
								<div key={event.id} className="rounded-xl border bg-slate-50 p-4">
									<p className="text-sm font-semibold text-sky-700">
										{formatDateTime(event.classDate)}
									</p>
									<p className="mt-1 text-base font-semibold text-slate-900">
										{event.lessonNumber
											? `Lesson ${event.lessonNumber}: ${event.lessonTitle}`
											: event.title || 'Untitled class'}
									</p>
									<p className="mt-1 text-sm text-slate-600">
										{event.groupCourseName}
										{event.platformCourseTitle
											? ` · ${event.platformCourseTitle}`
											: ''}
									</p>
									{event.notes ? (
										<p className="mt-2 text-sm text-slate-600">{event.notes}</p>
									) : null}
								</div>
							))}
						</div>
					) : (
						<div className="rounded-xl border border-dashed p-6 text-sm text-slate-600">
							No class events have been scheduled yet.
						</div>
					)}
				</div>
			</div>

			<StudyGroupScheduleCuration
				studyGroupId={studyGroupId}
				initialEvents={events as any}
				onEventUpdated={(event) =>
					setEvents((current) =>
						current.map((item) => (item.id === event.id ? event : item)),
					)
				}
			/>
		</div>
	)
}
