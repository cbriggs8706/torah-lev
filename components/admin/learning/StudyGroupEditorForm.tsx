'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'

type CourseOption = {
	id: string
	title: string
}

type StudyGroupFormValue = {
	id?: string
	title: string
	activeCourseId: string | null
	courseIds: string[]
}

interface Props {
	locale: string
	mode: 'create' | 'read' | 'update'
	initialStudyGroup?: StudyGroupFormValue
	courses: CourseOption[]
	updateHref?: string
	deleteHref?: string
	deleteLabel?: string
}

export function StudyGroupEditorForm({
	locale,
	mode,
	initialStudyGroup,
	courses,
	updateHref,
	deleteHref,
	deleteLabel = 'study group',
}: Props) {
	const router = useRouter()
	const titleReadOnly = mode === 'read'
	const [status, setStatus] = useState<string | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [saving, setSaving] = useState(false)
	const [studyGroup, setStudyGroup] = useState<StudyGroupFormValue>(
		initialStudyGroup ?? {
			title: '',
			activeCourseId: null,
			courseIds: [],
		}
	)

	const relatedCourses = courses.filter((course) =>
		studyGroup.courseIds.includes(course.id)
	)

	function toggleCourse(courseId: string, checked: boolean) {
		setStudyGroup((current) => {
			const courseIds =
				checked === true
					? [...current.courseIds, courseId]
					: current.courseIds.filter((id) => id !== courseId)
			return {
				...current,
				courseIds,
				activeCourseId: courseIds.includes(current.activeCourseId ?? '')
					? current.activeCourseId
					: null,
			}
		})
	}

	async function save() {
		setSaving(true)
		setStatus(null)
		setError(null)

		try {
			const url =
				mode === 'create'
					? '/api/admin/learning/study-groups'
					: `/api/admin/learning/study-groups/${studyGroup.id}`
			const method = mode === 'create' ? 'POST' : 'PATCH'
			const res = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(studyGroup),
			})

			if (!res.ok) {
				const body = await res.json().catch(() => null)
				throw new Error(body?.error || 'Unable to save study group')
			}

			setStatus(mode === 'create' ? 'Study group created' : 'Study group saved')
			router.push(`/${locale}/admin/learning/study-groups`)
			router.refresh()
		} catch (err) {
			setError(
				err instanceof Error ? err.message : 'Unable to save study group'
			)
		} finally {
			setSaving(false)
		}
	}

	return (
		<div className="space-y-6">
			<div className="space-y-6 rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
				<div className="grid gap-4 md:grid-cols-2">
					<div className="space-y-2">
						<Label htmlFor="title">Title</Label>
						<Input
							id="title"
							value={studyGroup.title}
							disabled={titleReadOnly}
							onChange={(e) =>
								setStudyGroup((current) => ({
									...current,
									title: e.target.value,
								}))
							}
						/>
					</div>

					<div className="space-y-2">
						<Label>Active Course</Label>
						<Select
							value={studyGroup.activeCourseId ?? 'none'}
							onValueChange={(value) =>
								setStudyGroup((current) => ({
									...current,
									activeCourseId: value === 'none' ? null : value,
								}))
							}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Select active course" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">No active course</SelectItem>
								{relatedCourses.map((course) => (
									<SelectItem key={course.id} value={course.id}>
										{course.title}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				<div className="space-y-3">
					<div>
						<Label>Related Courses</Label>
						<p className="mt-1 text-sm text-muted-foreground">
							Checked courses are assigned to this study group. Uncheck a
							course to remove the relationship without deleting the course.
						</p>
					</div>

					<div className="space-y-2 rounded-2xl border border-dashed p-4">
						{courses.map((course) => {
							const checked = studyGroup.courseIds.includes(course.id)

							return (
								<div
									key={course.id}
									className="flex flex-col gap-2 rounded-xl border border-border/50 p-3 md:flex-row md:items-center md:justify-between"
								>
									<label className="flex items-center gap-2 text-sm">
										<Checkbox
											checked={checked}
											onCheckedChange={(value) =>
												toggleCourse(course.id, value === true)
											}
										/>
										<span>{course.title}</span>
										{studyGroup.activeCourseId === course.id ? (
											<span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
												Active
											</span>
										) : null}
									</label>
									{checked ? (
										<div className="flex gap-2 md:justify-end">
											<Button asChild size="sm" variant="outline">
												<Link
													href={`/${locale}/admin/learning/courses/${course.id}/update`}
												>
													Update
												</Link>
											</Button>
											<Button
												asChild
												size="icon"
												variant="destructive"
												className="h-8 w-8"
											>
												<Link
													href={`/${locale}/admin/learning/courses/${course.id}/delete`}
													aria-label={`Delete ${course.title}`}
													title={`Delete ${course.title}`}
												>
													<Trash2 className="h-4 w-4" />
													<span className="sr-only">Delete</span>
												</Link>
											</Button>
										</div>
									) : null}
								</div>
							)
						})}
						{courses.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								No courses exist yet.
							</p>
						) : null}
					</div>
				</div>

				{status ? <p className="text-sm text-emerald-700">{status}</p> : null}
				{error ? <p className="text-sm text-destructive">{error}</p> : null}
			</div>

			<div className="flex flex-wrap items-center gap-2">
				<Button
					type="button"
					variant="outline"
					onClick={() => router.push(`/${locale}/admin/learning/study-groups`)}
				>
					Back to study groups
				</Button>
				<Button
					type="button"
					onClick={save}
					disabled={saving || !studyGroup.title.trim()}
				>
					{saving ? 'Saving...' : 'Save Study Group'}
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
		</div>
	)
}
