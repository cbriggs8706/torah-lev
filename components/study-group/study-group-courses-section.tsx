'use client'

import {
	useEffect,
	useRef,
	useState,
	type ChangeEvent,
	type FormEvent,
} from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type StudyGroupCourse = {
	id: number
	name: string
	imageUrl: string
	startDate: string | Date | null
	endDate: string | Date | null
}

type StudyGroupCoursesSectionProps = {
	studyGroupId: number
	initialCourses: StudyGroupCourse[]
	canManage: boolean
	allowInlineEditing?: boolean
	manageHref?: string
	onCoursesChange?: (courses: StudyGroupCourse[]) => void
}

export default function StudyGroupCoursesSection({
	studyGroupId,
	initialCourses,
	canManage,
	allowInlineEditing = true,
	manageHref,
	onCoursesChange,
}: StudyGroupCoursesSectionProps) {
	const fileInputRef = useRef<HTMLInputElement | null>(null)
	const editFileInputRef = useRef<HTMLInputElement | null>(null)
	const [courses, setCourses] = useState(initialCourses)
	const [name, setName] = useState('')
	const [startDate, setStartDate] = useState('')
	const [endDate, setEndDate] = useState('')
	const [selectedFile, setSelectedFile] = useState<File | null>(null)
	const [previewUrl, setPreviewUrl] = useState<string | null>(null)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [editingCourseId, setEditingCourseId] = useState<number | null>(null)
	const [editName, setEditName] = useState('')
	const [editStartDate, setEditStartDate] = useState('')
	const [editEndDate, setEditEndDate] = useState('')
	const [editSelectedFile, setEditSelectedFile] = useState<File | null>(null)
	const [editPreviewUrl, setEditPreviewUrl] = useState<string | null>(null)
	const [isSavingEdit, setIsSavingEdit] = useState(false)

	useEffect(() => {
		onCoursesChange?.(courses)
	}, [courses, onCoursesChange])

	useEffect(() => {
		return () => {
			if (previewUrl) {
				URL.revokeObjectURL(previewUrl)
			}

			if (editPreviewUrl) {
				URL.revokeObjectURL(editPreviewUrl)
			}
		}
	}, [editPreviewUrl, previewUrl])

	const toDateInputValue = (value: string | Date | null) => {
		if (!value) return ''

		if (value instanceof Date) {
			return value.toISOString().slice(0, 10)
		}

		const trimmed = value.trim()
		if (!trimmed) return ''
		return trimmed.slice(0, 10)
	}

	const formatDateLabel = (value: string | Date | null) => {
		if (!value) return null

		const parsed = value instanceof Date ? value : new Date(value)
		if (Number.isNaN(parsed.getTime())) return null

		return parsed.toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		})
	}

	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl)
		}

		const file = event.target.files?.[0] ?? null
		setSelectedFile(file)
		setPreviewUrl(file ? URL.createObjectURL(file) : null)
	}

	const handleEditFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		if (editPreviewUrl) {
			URL.revokeObjectURL(editPreviewUrl)
		}

		const file = event.target.files?.[0] ?? null
		setEditSelectedFile(file)
		setEditPreviewUrl(file ? URL.createObjectURL(file) : null)
	}

	const resetForm = () => {
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl)
		}

		setName('')
		setStartDate('')
		setEndDate('')
		setSelectedFile(null)
		setPreviewUrl(null)

		if (fileInputRef.current) {
			fileInputRef.current.value = ''
		}
	}

	const resetEditForm = () => {
		if (editPreviewUrl) {
			URL.revokeObjectURL(editPreviewUrl)
		}

		setEditingCourseId(null)
		setEditName('')
		setEditStartDate('')
		setEditEndDate('')
		setEditSelectedFile(null)
		setEditPreviewUrl(null)

		if (editFileInputRef.current) {
			editFileInputRef.current.value = ''
		}
	}

	const beginEditing = (course: StudyGroupCourse) => {
		if (editPreviewUrl) {
			URL.revokeObjectURL(editPreviewUrl)
		}

		setEditingCourseId(course.id)
		setEditName(course.name)
		setEditStartDate(toDateInputValue(course.startDate))
		setEditEndDate(toDateInputValue(course.endDate))
		setEditSelectedFile(null)
		setEditPreviewUrl(null)

		if (editFileInputRef.current) {
			editFileInputRef.current.value = ''
		}
	}

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()

		const trimmedName = name.trim()
		if (!trimmedName) {
			toast.error('Course name is required.')
			return
		}

		if (startDate && endDate && startDate > endDate) {
			toast.error('End date must be on or after the start date.')
			return
		}

		const formData = new FormData()
		formData.append('name', trimmedName)
		formData.append('startDate', startDate)
		formData.append('endDate', endDate)
		if (selectedFile) {
			formData.append('image', selectedFile)
		}

		setIsSubmitting(true)

		try {
			const response = await fetch(`/api/study-groups/${studyGroupId}/courses`, {
				method: 'POST',
				body: formData,
			})
			const result = await response.json()

			if (!response.ok) {
				throw new Error(result.error || 'Failed to create course')
			}

			setCourses((current) => [result.course, ...current])
			resetForm()
			toast.success('Course added to study group.')
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Failed to create course'
			)
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleSaveEdit = async (courseId: number) => {
		const trimmedName = editName.trim()
		if (!trimmedName) {
			toast.error('Course name is required.')
			return
		}

		if (editStartDate && editEndDate && editStartDate > editEndDate) {
			toast.error('End date must be on or after the start date.')
			return
		}

		const formData = new FormData()
		formData.append('name', trimmedName)
		formData.append('startDate', editStartDate)
		formData.append('endDate', editEndDate)
		if (editSelectedFile) {
			formData.append('image', editSelectedFile)
		}

		setIsSavingEdit(true)

		try {
			const response = await fetch(
				`/api/study-groups/${studyGroupId}/courses/${courseId}`,
				{
					method: 'PUT',
					body: formData,
				}
			)
			const result = await response.json()

			if (!response.ok) {
				throw new Error(result.error || 'Failed to update course')
			}

			setCourses((current) =>
				current.map((course) =>
					course.id === courseId ? result.course : course
				)
			)
			resetEditForm()
			toast.success('Course updated.')
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Failed to update course'
			)
		} finally {
			setIsSavingEdit(false)
		}
	}

	return (
		<div className="rounded-xl border bg-white p-5 shadow-sm space-y-5">
			<div className="space-y-1">
				<h2 className="text-xl font-semibold text-slate-900">Group Courses</h2>
				<p className="text-sm text-slate-600">
					Courses created specifically for this study group.
				</p>
			</div>

			{canManage ? (
				<form
					onSubmit={handleSubmit}
					className="rounded-xl border border-sky-100 bg-sky-50 p-4 space-y-4"
				>
					<div className="space-y-2">
						<Label htmlFor="study-group-course-name">Course name</Label>
						<Input
							id="study-group-course-name"
							value={name}
							onChange={(event) => setName(event.target.value)}
							placeholder="Intro to Gospel Greek"
							maxLength={120}
							disabled={isSubmitting}
						/>
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="study-group-course-start-date">Start date</Label>
							<Input
								id="study-group-course-start-date"
								type="date"
								value={startDate}
								onChange={(event) => setStartDate(event.target.value)}
								disabled={isSubmitting}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="study-group-course-end-date">End date</Label>
							<Input
								id="study-group-course-end-date"
								type="date"
								value={endDate}
								onChange={(event) => setEndDate(event.target.value)}
								disabled={isSubmitting}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="study-group-course-image">
							Course image (optional)
						</Label>
						<Input
							ref={fileInputRef}
							id="study-group-course-image"
							type="file"
							accept="image/*"
							onChange={handleFileChange}
							disabled={isSubmitting}
						/>
					</div>

					{previewUrl ? (
						<div className="relative h-40 w-full overflow-hidden rounded-xl border bg-white sm:w-64">
							<Image
								src={previewUrl}
								alt="Selected course preview"
								fill
								sizes="256px"
								className="object-cover"
								unoptimized
							/>
						</div>
					) : null}

					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting ? 'Adding Course...' : 'Add Course'}
					</Button>
				</form>
			) : null}

			{courses.length > 0 ? (
				<div className="grid gap-4 sm:grid-cols-2">
					{courses.map((course) => (
						<div key={course.id} className="overflow-hidden rounded-xl border bg-slate-50">
							<div className="relative h-40 w-full bg-slate-200">
								<Image
									src={course.imageUrl}
									alt={course.name}
									fill
									sizes="(min-width: 640px) 50vw, 100vw"
									className="object-cover"
								/>
							</div>
							<div className="p-4 space-y-4">
								{editingCourseId === course.id ? (
									allowInlineEditing ? (
										<div className="space-y-4">
										<div className="space-y-2">
											<Label htmlFor={`course-name-${course.id}`}>Course name</Label>
											<Input
												id={`course-name-${course.id}`}
												value={editName}
												onChange={(event) => setEditName(event.target.value)}
												disabled={isSavingEdit}
											/>
										</div>

										<div className="grid gap-4 sm:grid-cols-2">
											<div className="space-y-2">
												<Label htmlFor={`course-start-${course.id}`}>Start date</Label>
												<Input
													id={`course-start-${course.id}`}
													type="date"
													value={editStartDate}
													onChange={(event) => setEditStartDate(event.target.value)}
													disabled={isSavingEdit}
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor={`course-end-${course.id}`}>End date</Label>
												<Input
													id={`course-end-${course.id}`}
													type="date"
													value={editEndDate}
													onChange={(event) => setEditEndDate(event.target.value)}
													disabled={isSavingEdit}
												/>
											</div>
										</div>

										<div className="space-y-2">
											<Label htmlFor={`course-image-${course.id}`}>
												Replace image (optional)
											</Label>
											<Input
												ref={editFileInputRef}
												id={`course-image-${course.id}`}
												type="file"
												accept="image/*"
												onChange={handleEditFileChange}
												disabled={isSavingEdit}
											/>
										</div>

										{editPreviewUrl ? (
											<div className="relative h-32 w-full overflow-hidden rounded-xl border bg-white">
												<Image
													src={editPreviewUrl}
													alt="Updated course preview"
													fill
													sizes="100vw"
													className="object-cover"
													unoptimized
												/>
											</div>
										) : null}

										<div className="flex gap-2">
											<Button
												type="button"
												onClick={() => handleSaveEdit(course.id)}
												disabled={isSavingEdit}
											>
												{isSavingEdit ? 'Saving...' : 'Save'}
											</Button>
											<Button
												type="button"
												variant="ghost"
												onClick={resetEditForm}
												disabled={isSavingEdit}
											>
												Cancel
											</Button>
										</div>
										</div>
									) : null
								) : (
									<div className="space-y-3">
										<div>
											<h3 className="text-base font-semibold text-slate-900">
												{course.name}
											</h3>
											{formatDateLabel(course.startDate) || formatDateLabel(course.endDate) ? (
												<p className="mt-1 text-sm text-slate-600">
													{formatDateLabel(course.startDate) || 'No start date'}
													{' - '}
													{formatDateLabel(course.endDate) || 'No end date'}
												</p>
											) : null}
										</div>

										{canManage ? (
											allowInlineEditing ? (
												<Button
													type="button"
													variant="ghost"
													onClick={() => beginEditing(course)}
												>
													Edit Course
												</Button>
											) : manageHref ? (
												<Link href={manageHref}>
													<Button type="button" variant="ghost">
														Manage in Settings
													</Button>
												</Link>
											) : null
										) : null}
									</div>
								)}
							</div>
						</div>
					))}
				</div>
			) : (
				<div className="rounded-xl border border-dashed p-6 text-sm text-slate-600">
					No courses have been added to this study group yet.
				</div>
			)}
		</div>
	)
}
