'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type LessonOption = {
	id: string
	title: string
	number: number
	part: string
	sortOrder: number
}

type CourseFormValue = {
	id?: string
	title: string
	lessonIds: string[]
}

interface Props {
	locale: string
	mode: 'create' | 'read' | 'update'
	initialCourse?: CourseFormValue
	lessons: LessonOption[]
	showFooterActions?: boolean
	updateHref?: string
	deleteHref?: string
	deleteLabel?: string
}

export function CourseEditorForm({
	locale,
	mode,
	initialCourse,
	lessons,
	showFooterActions = true,
	updateHref,
	deleteHref,
	deleteLabel = 'course',
}: Props) {
	const router = useRouter()
	const titleReadOnly = mode === 'read'
	const [status, setStatus] = useState<string | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [saving, setSaving] = useState(false)
	const [course, setCourse] = useState<CourseFormValue>(
		initialCourse ?? {
			title: '',
			lessonIds: [],
		}
	)

	async function save() {
		setSaving(true)
		setStatus(null)
		setError(null)

		try {
			const url =
				mode === 'create'
					? '/api/admin/learning/courses'
					: `/api/admin/learning/courses/${course.id}`
			const method = mode === 'create' ? 'POST' : 'PATCH'
			const res = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(course),
			})

			if (!res.ok) {
				const body = await res.json().catch(() => null)
				throw new Error(body?.error || 'Unable to save course')
			}

			setStatus(mode === 'create' ? 'Course created' : 'Course saved')
			router.push(`/${locale}/admin/learning/courses`)
			router.refresh()
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Unable to save course')
		} finally {
			setSaving(false)
		}
	}

	return (
		<div className="space-y-6">
			<div className="space-y-6 rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
				<div className="space-y-2">
					<Label htmlFor="title">Title</Label>
					<Input
						id="title"
						value={course.title}
						disabled={titleReadOnly}
						onChange={(e) =>
							setCourse((current) => ({
								...current,
								title: e.target.value,
							}))
						}
					/>
				</div>

				<div className="space-y-3">
					<div>
						<Label>Lessons</Label>
						<p className="mt-1 text-sm text-muted-foreground">
							Checked lessons are assigned to this course. Uncheck a lesson to
							remove that course relationship without deleting the lesson.
						</p>
					</div>
					<div className="grid gap-2 rounded-2xl border border-dashed p-4 md:grid-cols-2">
						{lessons.map((lesson) => (
							<label key={lesson.id} className="flex items-center gap-2 text-sm">
								<Checkbox
									checked={course.lessonIds.includes(lesson.id)}
									onCheckedChange={(checked) =>
										setCourse((current) => ({
											...current,
											lessonIds:
												checked === true
													? [...current.lessonIds, lesson.id]
													: current.lessonIds.filter((id) => id !== lesson.id),
										}))
									}
								/>
								<span>
									{lesson.number}
									{lesson.part ? ` ${lesson.part}` : ''}. {lesson.title}
								</span>
							</label>
						))}
						{lessons.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								No lessons exist yet.
							</p>
						) : null}
					</div>
				</div>

				{status ? <p className="text-sm text-emerald-700">{status}</p> : null}
				{error ? <p className="text-sm text-destructive">{error}</p> : null}
			</div>

			{showFooterActions ? (
				<div className="flex flex-wrap items-center gap-2">
					<Button
						type="button"
						variant="outline"
						onClick={() => router.push(`/${locale}/admin/learning/courses`)}
					>
						Back to courses
					</Button>
					<Button
						type="button"
						onClick={save}
						disabled={saving || !course.title.trim()}
					>
						{saving ? 'Saving...' : 'Save Course'}
					</Button>
					{updateHref ? (
						<Button asChild size="sm" variant="outline">
							<Link href={updateHref}>Update</Link>
						</Button>
					) : null}
					{deleteHref ? (
						<Button
							asChild
							size="icon"
							variant="destructive"
							className="h-8 w-8"
						>
							<Link
								href={deleteHref}
								aria-label={`Delete ${deleteLabel}`}
								title={`Delete ${deleteLabel}`}
							>
								<Trash2 className="h-4 w-4" />
								<span className="sr-only">Delete</span>
							</Link>
						</Button>
					) : null}
				</div>
			) : null}
		</div>
	)
}
