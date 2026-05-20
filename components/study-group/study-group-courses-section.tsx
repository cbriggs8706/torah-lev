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

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type StudyGroupCourse = {
	id: number
	name: string
	imageUrl: string
}

type StudyGroupCoursesSectionProps = {
	studyGroupId: number
	initialCourses: StudyGroupCourse[]
	canManage: boolean
}

export default function StudyGroupCoursesSection({
	studyGroupId,
	initialCourses,
	canManage,
}: StudyGroupCoursesSectionProps) {
	const fileInputRef = useRef<HTMLInputElement | null>(null)
	const [courses, setCourses] = useState(initialCourses)
	const [name, setName] = useState('')
	const [selectedFile, setSelectedFile] = useState<File | null>(null)
	const [previewUrl, setPreviewUrl] = useState<string | null>(null)
	const [isSubmitting, setIsSubmitting] = useState(false)

	useEffect(() => {
		return () => {
			if (previewUrl) {
				URL.revokeObjectURL(previewUrl)
			}
		}
	}, [previewUrl])

	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl)
		}

		const file = event.target.files?.[0] ?? null
		setSelectedFile(file)
		setPreviewUrl(file ? URL.createObjectURL(file) : null)
	}

	const resetForm = () => {
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl)
		}

		setName('')
		setSelectedFile(null)
		setPreviewUrl(null)

		if (fileInputRef.current) {
			fileInputRef.current.value = ''
		}
	}

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()

		const trimmedName = name.trim()
		if (!trimmedName) {
			toast.error('Course name is required.')
			return
		}

		const formData = new FormData()
		formData.append('name', trimmedName)
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
						<div
							key={course.id}
							className="overflow-hidden rounded-xl border bg-slate-50"
						>
							<div className="relative h-40 w-full bg-slate-200">
								<Image
									src={course.imageUrl}
									alt={course.name}
									fill
									sizes="(min-width: 640px) 50vw, 100vw"
									className="object-cover"
								/>
							</div>
							<div className="p-4">
								<h3 className="text-base font-semibold text-slate-900">
									{course.name}
								</h3>
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
