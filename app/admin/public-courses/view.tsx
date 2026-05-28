'use client'

import {
	useEffect,
	useMemo,
	useState,
	type ChangeEvent,
} from 'react'
import Image from 'next/image'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'

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

type CuratedLesson = {
	id: number
	order: number
	platformCourseId: number
	platformCourse: {
		id: number
		title: string
	}
	lesson: {
		id: number
		title: string
		lessonNumber: string | null
		unit: {
			title: string | null
			order: number | null
		} | null
	}
}

type PublicCourseRecord = {
	id: number
	name: string
	imageUrl: string
	proficiencyLevel: string | null
	endingProficiencyLevel: string | null
	lessons: CuratedLesson[]
}

type DraftLesson = {
	platformCourseId: number
	platformCourseTitle: string
	lessonId: number
	lessonTitle: string
	lessonNumber: string | number | null
	unitTitle: string | null
}

const blankForm = {
	name: '',
	proficiencyLevel: '',
	endingProficiencyLevel: '',
}

export default function PublicCoursesAdminPage() {
	const [courses, setCourses] = useState<PublicCourseRecord[]>([])
	const [platformCourses, setPlatformCourses] = useState<PlatformCourse[]>([])
	const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null)
	const [form, setForm] = useState(blankForm)
	const [draftLessons, setDraftLessons] = useState<DraftLesson[]>([])
	const [selectedPlatformCourseId, setSelectedPlatformCourseId] = useState('')
	const [selectedLessonId, setSelectedLessonId] = useState('')
	const [availableLessons, setAvailableLessons] = useState<LessonOption[]>([])
	const [loadingLessons, setLoadingLessons] = useState(false)
	const [selectedFile, setSelectedFile] = useState<File | null>(null)
	const [previewUrl, setPreviewUrl] = useState<string | null>(null)
	const [isSaving, setIsSaving] = useState(false)
	const [platformPickerOpen, setPlatformPickerOpen] = useState(false)
	const [lessonPickerOpen, setLessonPickerOpen] = useState(false)

	const selectedCourse = useMemo(
		() => courses.find((course) => course.id === selectedCourseId) ?? null,
		[courses, selectedCourseId]
	)

	useEffect(() => {
		const loadCourses = async () => {
			const response = await fetch('/api/public-courses')
			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.error || 'Failed to load public courses')
			}

			setCourses(data.courses ?? [])
		}

		void loadCourses().catch((error) => {
			toast.error(error instanceof Error ? error.message : 'Failed to load courses')
		})

		void fetch('/api/public/curriculum?sort=["title","ASC"]&range=[0,199]')
			.then(async (response) => {
				if (!response.ok) {
					throw new Error('Failed to load source curriculum')
				}
				return response.json()
			})
			.then((data: PlatformCourse[]) => setPlatformCourses(data))
			.catch(() => {
				toast.error('Could not load source curriculum.')
			})
	}, [])

	useEffect(() => {
		if (!selectedPlatformCourseId) {
			setAvailableLessons([])
			setSelectedLessonId('')
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
			.then((data: LessonOption[]) => setAvailableLessons(data))
			.catch(() => {
				setAvailableLessons([])
				toast.error('Could not load lessons for that course.')
			})
			.finally(() => setLoadingLessons(false))
	}, [selectedPlatformCourseId])

	const resetEditor = () => {
		setSelectedCourseId(null)
		setForm(blankForm)
		setDraftLessons([])
		setSelectedPlatformCourseId('')
		setSelectedLessonId('')
		setAvailableLessons([])
		setSelectedFile(null)
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl)
			setPreviewUrl(null)
		}
	}

	const startEditing = (course: PublicCourseRecord) => {
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl)
			setPreviewUrl(null)
		}

		setSelectedCourseId(course.id)
		setForm({
			name: course.name,
			proficiencyLevel: course.proficiencyLevel ?? '',
			endingProficiencyLevel: course.endingProficiencyLevel ?? '',
		})
		setDraftLessons(
			(course.lessons ?? [])
				.slice()
				.sort((a, b) => a.order - b.order)
				.map((lesson) => ({
					platformCourseId: lesson.platformCourseId,
					platformCourseTitle: lesson.platformCourse.title,
					lessonId: lesson.lesson.id,
					lessonTitle: lesson.lesson.title,
					lessonNumber: lesson.lesson.lessonNumber,
					unitTitle: lesson.lesson.unit?.title ?? null,
				}))
		)
		setSelectedFile(null)
	}

	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl)
		}

		const file = event.target.files?.[0] ?? null
		setSelectedFile(file)
		setPreviewUrl(file ? URL.createObjectURL(file) : null)
	}

	const addLesson = () => {
		const courseId = Number(selectedPlatformCourseId)
		const lessonId = Number(selectedLessonId)

		if (!courseId || !lessonId) {
			toast.error('Choose both a source course and lesson.')
			return
		}

		const platformCourse = platformCourses.find((course) => course.id === courseId)
		const lesson = availableLessons.find((item) => item.id === lessonId)

		if (!platformCourse || !lesson) {
			toast.error('Could not add that lesson.')
			return
		}

		setDraftLessons((current) => [
			...current,
			{
				platformCourseId: courseId,
				platformCourseTitle: platformCourse.title,
				lessonId: lesson.id,
				lessonTitle: lesson.title,
				lessonNumber: lesson.lessonNumber ?? null,
				unitTitle: lesson.unitTitle ?? null,
			},
		])
		setSelectedLessonId('')
	}

	const moveLesson = (index: number, direction: -1 | 1) => {
		setDraftLessons((current) => {
			const nextIndex = index + direction
			if (nextIndex < 0 || nextIndex >= current.length) return current

			const next = current.slice()
			;[next[index], next[nextIndex]] = [next[nextIndex], next[index]]
			return next
		})
	}

	const removeLesson = (index: number) => {
		setDraftLessons((current) => current.filter((_, currentIndex) => currentIndex !== index))
	}

	const handleSave = async () => {
		if (!form.name.trim()) {
			toast.error('Course name is required.')
			return
		}

		if (!draftLessons.length) {
			toast.error('Add at least one lesson to this public course.')
			return
		}

		setIsSaving(true)

		try {
			const formData = new FormData()
			formData.append('name', form.name.trim())
			formData.append('proficiencyLevel', form.proficiencyLevel.trim())
			formData.append(
				'endingProficiencyLevel',
				form.endingProficiencyLevel.trim()
			)
			if (selectedFile) {
				formData.append('image', selectedFile)
			}

			const courseResponse = await fetch(
				selectedCourseId
					? `/api/public-courses/${selectedCourseId}`
					: '/api/public-courses',
				{
					method: selectedCourseId ? 'PUT' : 'POST',
					body: formData,
				}
			)
			const courseData = await courseResponse.json()

			if (!courseResponse.ok) {
				throw new Error(courseData.error || 'Failed to save public course')
			}

			const savedCourseId = courseData.course.id as number
			const lessonsResponse = await fetch(
				`/api/public-courses/${savedCourseId}/lessons`,
				{
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						lessons: draftLessons.map((lesson, index) => ({
							platformCourseId: lesson.platformCourseId,
							lessonId: lesson.lessonId,
							order: index + 1,
						})),
					}),
				}
			)
			const lessonsData = await lessonsResponse.json()

			if (!lessonsResponse.ok) {
				throw new Error(lessonsData.error || 'Failed to save curated lessons')
			}

			const refreshResponse = await fetch('/api/public-courses')
			const refreshData = await refreshResponse.json()

			if (!refreshResponse.ok) {
				throw new Error(refreshData.error || 'Failed to refresh public courses')
			}

			setCourses(refreshData.courses ?? [])
			setSelectedCourseId(savedCourseId)
			setSelectedFile(null)
			toast.success(
				selectedCourseId
					? 'Public course updated.'
					: 'Public course created.'
			)
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Failed to save public course'
			)
		} finally {
			setIsSaving(false)
		}
	}

	return (
		<div className="space-y-6 px-6 py-5">
			<div className="space-y-1">
				<h1 className="text-2xl font-semibold text-slate-900">Public Courses</h1>
				<p className="text-sm text-slate-600">
					Create self-paced courses that reuse lessons from across the curriculum.
				</p>
			</div>

			<div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
				<div className="rounded-2xl border bg-white p-4 shadow-sm space-y-4">
					<div className="flex items-center justify-between">
						<h2 className="text-lg font-semibold text-slate-900">Courses</h2>
							<Button type="button" variant="ghost" onClick={resetEditor}>
							New Course
						</Button>
					</div>

					<div className="space-y-3">
						{courses.map((course) => (
							<button
								key={course.id}
								type="button"
								onClick={() => startEditing(course)}
								className={`w-full rounded-xl border p-3 text-left transition ${
									selectedCourseId === course.id
										? 'border-sky-300 bg-sky-50'
										: 'border-slate-200 bg-slate-50 hover:bg-slate-100'
								}`}
							>
								<p className="font-semibold text-slate-900">{course.name}</p>
								<p className="mt-1 text-sm text-slate-600">
									{course.lessons.length} curated lesson
									{course.lessons.length === 1 ? '' : 's'}
								</p>
							</button>
						))}
					</div>
				</div>

				<div className="rounded-2xl border bg-white p-5 shadow-sm space-y-5">
					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="public-course-name">Course name</Label>
							<Input
								id="public-course-name"
								value={form.name}
								onChange={(event) =>
									setForm((current) => ({ ...current, name: event.target.value }))
								}
								placeholder="Intro to Gospel Greek"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="public-course-image">Course image</Label>
							<Input
								id="public-course-image"
								type="file"
								accept="image/*"
								onChange={handleFileChange}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="public-course-start-level">
								Starting proficiency
							</Label>
							<Input
								id="public-course-start-level"
								value={form.proficiencyLevel}
								onChange={(event) =>
									setForm((current) => ({
										...current,
										proficiencyLevel: event.target.value,
									}))
								}
								placeholder="A1"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="public-course-end-level">
								Ending proficiency
							</Label>
							<Input
								id="public-course-end-level"
								value={form.endingProficiencyLevel}
								onChange={(event) =>
									setForm((current) => ({
										...current,
										endingProficiencyLevel: event.target.value,
									}))
								}
								placeholder="A2"
							/>
						</div>
					</div>

					{previewUrl || selectedCourse?.imageUrl ? (
						<div className="relative h-48 w-full overflow-hidden rounded-2xl border bg-slate-100">
							<Image
								src={previewUrl ?? selectedCourse?.imageUrl ?? '/mascot.svg'}
								alt={form.name || 'Public course preview'}
								fill
								sizes="(min-width: 1280px) 50vw, 100vw"
								className="object-cover"
								unoptimized={Boolean(previewUrl)}
							/>
						</div>
					) : null}

					<div className="rounded-2xl border border-sky-100 bg-sky-50 p-4 space-y-4">
						<div className="space-y-1">
							<h2 className="text-lg font-semibold text-slate-900">
								Curated Lessons
							</h2>
							<p className="text-sm text-slate-600">
								Build the course from lessons across one or many curriculum
								courses.
							</p>
						</div>

						<div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
							<Popover open={platformPickerOpen} onOpenChange={setPlatformPickerOpen}>
								<PopoverTrigger asChild>
									<Button type="button" variant="ghost" className="justify-between">
										{selectedPlatformCourseId
											? platformCourses.find(
													(course) =>
														String(course.id) === selectedPlatformCourseId
											  )?.title ?? 'Choose source course'
											: 'Choose source course'}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="p-0" align="start">
									<Command>
										<CommandInput placeholder="Search curriculum..." />
										<CommandList>
											<CommandEmpty>No courses found.</CommandEmpty>
											<CommandGroup>
												{platformCourses.map((course) => (
													<CommandItem
														key={course.id}
														onSelect={() => {
															setSelectedPlatformCourseId(String(course.id))
															setPlatformPickerOpen(false)
														}}
													>
														{course.title}
													</CommandItem>
												))}
											</CommandGroup>
										</CommandList>
									</Command>
								</PopoverContent>
							</Popover>

							<Popover open={lessonPickerOpen} onOpenChange={setLessonPickerOpen}>
								<PopoverTrigger asChild>
									<Button
										type="button"
										variant="ghost"
										className="justify-between"
										disabled={!selectedPlatformCourseId || loadingLessons}
									>
										{selectedLessonId
											? availableLessons.find(
													(lesson) => String(lesson.id) === selectedLessonId
											  )?.title ?? 'Choose lesson'
											: loadingLessons
											? 'Loading lessons...'
											: 'Choose lesson'}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="p-0" align="start">
									<Command>
										<CommandInput placeholder="Search lessons..." />
										<CommandList>
											<CommandEmpty>No lessons found.</CommandEmpty>
											<CommandGroup>
												{availableLessons.map((lesson) => (
													<CommandItem
														key={lesson.id}
														onSelect={() => {
															setSelectedLessonId(String(lesson.id))
															setLessonPickerOpen(false)
														}}
													>
														{lesson.lessonNumber
															? `Lesson ${lesson.lessonNumber}: `
															: ''}
														{lesson.title}
													</CommandItem>
												))}
											</CommandGroup>
										</CommandList>
									</Command>
								</PopoverContent>
							</Popover>

							<Button type="button" onClick={addLesson}>
								Add Lesson
							</Button>
						</div>

						<div className="space-y-3">
							{draftLessons.length > 0 ? (
								draftLessons.map((lesson, index) => (
									<div
										key={`${lesson.platformCourseId}-${lesson.lessonId}-${index}`}
										className="rounded-xl border bg-white p-4"
									>
										<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
											<div>
												<p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
													Step {index + 1}
												</p>
												<h3 className="text-base font-semibold text-slate-900">
													{lesson.lessonNumber
														? `Lesson ${lesson.lessonNumber}: ${lesson.lessonTitle}`
														: lesson.lessonTitle}
												</h3>
												<p className="text-sm text-slate-600">
													{lesson.platformCourseTitle}
													{lesson.unitTitle ? ` · ${lesson.unitTitle}` : ''}
												</p>
											</div>
											<div className="flex gap-2">
												<Button
													type="button"
													variant="ghost"
													onClick={() => moveLesson(index, -1)}
													disabled={index === 0}
												>
													Up
												</Button>
												<Button
													type="button"
													variant="ghost"
													onClick={() => moveLesson(index, 1)}
													disabled={index === draftLessons.length - 1}
												>
													Down
												</Button>
												<Button
													type="button"
													variant="ghost"
													onClick={() => removeLesson(index)}
												>
													Remove
												</Button>
											</div>
										</div>
									</div>
								))
							) : (
								<div className="rounded-xl border border-dashed bg-white p-6 text-sm text-slate-600">
									No lessons added yet.
								</div>
							)}
						</div>
					</div>

					<Button type="button" onClick={handleSave} disabled={isSaving}>
						{isSaving
							? 'Saving...'
							: selectedCourseId
							? 'Update Public Course'
							: 'Create Public Course'}
					</Button>
				</div>
			</div>
		</div>
	)
}
