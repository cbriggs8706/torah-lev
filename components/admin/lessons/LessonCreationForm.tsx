'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { buildLessonSlug } from '@/lib/lessons/slug'

type UnitOption = {
	id: string
	slug: string
}

type CourseOption = {
	id: string
	slug: string
	courseCode: string
	units: UnitOption[]
}

export function LessonCreationForm({
	locale,
	courses,
}: {
	locale: string
	courses: CourseOption[]
}) {
	const [courseId, setCourseId] = useState(courses[0]?.id ?? '')
	const [unitId, setUnitId] = useState(courses[0]?.units[0]?.id ?? '')
	const [title, setTitle] = useState('')
	const [lessonNumber, setLessonNumber] = useState('')
	const [description, setDescription] = useState('')
	const [primaryType, setPrimaryType] = useState<'youtube' | 'other'>('youtube')
	const [youtubeUrl, setYoutubeUrl] = useState('')
	const [loading, setLoading] = useState(false)
	const [createdLessonId, setCreatedLessonId] = useState<string | null>(null)
	const [error, setError] = useState<string | null>(null)

	const selectedCourse = useMemo(
		() => courses.find((course) => course.id === courseId),
		[courseId, courses],
	)
	const generatedSlug = useMemo(
		() => buildLessonSlug(title, lessonNumber),
		[title, lessonNumber],
	)

	if (courses.length === 0) {
		return (
			<div className="mx-auto w-full max-w-3xl rounded-md border p-4">
				<p className="text-sm text-muted-foreground">
					No courses found. Create a course first, then create lessons here.
				</p>
			</div>
		)
	}

	async function onCreateLesson() {
		setLoading(true)
		setError(null)
		setCreatedLessonId(null)

		try {
			const res = await fetch('/api/admin/courses/lessons', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					courseId,
					unitId: unitId || undefined,
					title,
					lessonNumber,
					description: description || undefined,
					primaryType,
					youtubeUrl,
				}),
			})

			const data = await res.json()
			if (!res.ok) {
				throw new Error(data?.error || 'Failed to create lesson')
			}

			setCreatedLessonId(data.lesson.id)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to create lesson')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
			<div className="space-y-1">
				<h1 className="text-2xl font-semibold">Create Lesson</h1>
				<p className="text-sm text-muted-foreground">
					Create the lesson shell first, then enter script at hebrew-ingest.
				</p>
			</div>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<div className="space-y-2">
					<Label>Course</Label>
					<Select
						value={courseId}
						onValueChange={(value) => {
							setCourseId(value)
							const firstUnitId =
								courses.find((course) => course.id === value)?.units[0]?.id ?? ''
							setUnitId(firstUnitId)
						}}
					>
						<SelectTrigger>
							<SelectValue placeholder="Select course" />
						</SelectTrigger>
						<SelectContent>
							{courses.map((course) => (
								<SelectItem key={course.id} value={course.id}>
									{course.slug} ({course.courseCode})
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-2">
					<Label>Unit (optional)</Label>
					<Select value={unitId} onValueChange={setUnitId}>
						<SelectTrigger>
							<SelectValue placeholder="Auto-select/create unit" />
						</SelectTrigger>
						<SelectContent>
							{(selectedCourse?.units ?? []).map((unit) => (
								<SelectItem key={unit.id} value={unit.id}>
									{unit.slug}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<div className="space-y-2">
					<Label>Title</Label>
					<Input
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						placeholder="Intro to Shalom"
					/>
				</div>
				<div className="space-y-2">
					<Label>Lesson Number</Label>
					<Input
						value={lessonNumber}
						onChange={(e) => setLessonNumber(e.target.value)}
						placeholder="e.g. 1, 1a, 2, 2b"
					/>
				</div>
			</div>

			<div className="space-y-2">
				<Label>Slug (auto-generated)</Label>
				<Input value={generatedSlug} readOnly disabled />
			</div>

			<div className="space-y-2">
				<Label>Description (optional)</Label>
				<Textarea
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					placeholder="Optional notes about this lesson"
				/>
			</div>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<div className="space-y-2">
					<Label>Primary Type</Label>
					<Select
						value={primaryType}
						onValueChange={(value) => setPrimaryType(value as 'youtube' | 'other')}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="youtube">youtube</SelectItem>
							<SelectItem value="other">other</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-2">
					<Label>YouTube URL</Label>
					<Input
						disabled={primaryType !== 'youtube'}
						value={youtubeUrl}
						onChange={(e) => setYoutubeUrl(e.target.value)}
						placeholder="https://www.youtube.com/watch?v=..."
					/>
				</div>
			</div>

			<div className="flex items-center gap-3">
				<Button
					disabled={loading || !title.trim() || !lessonNumber.trim()}
					onClick={onCreateLesson}
				>
					{loading ? 'Creating...' : 'Create Lesson'}
				</Button>
			</div>

			{error ? <p className="text-sm text-red-600">{error}</p> : null}

			{createdLessonId ? (
				<div className="rounded-md border p-4">
					<p className="text-sm font-medium">Lesson created.</p>
					<div className="mt-3 flex flex-wrap gap-2">
						<Link
							href={`/${locale}/admin/hebrew-ingest?mode=lesson-script&lessonId=${createdLessonId}`}
						>
							<Button>Enter Lesson Script</Button>
						</Link>
						<Link href={`/${locale}/admin/courses/lessons/${createdLessonId}/vocab`}>
							<Button variant="outline">Review Vocab</Button>
						</Link>
					</div>
				</div>
			) : null}
		</div>
	)
}
