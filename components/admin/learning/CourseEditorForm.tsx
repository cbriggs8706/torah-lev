'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	closestCenter,
	useSensor,
	useSensors,
} from '@dnd-kit/core'
import {
	SortableContext,
	arrayMove,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'

type LessonOption = {
	id: string
	title: string
	number: number
	part: string
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
	const readOnly = mode === 'read'
	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	)
	const [status, setStatus] = useState<string | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [saving, setSaving] = useState(false)
	const [course, setCourse] = useState<CourseFormValue>(
		initialCourse ?? {
			title: '',
			lessonIds: [],
		}
	)
	const selectedLessons = course.lessonIds
		.map((lessonId) => lessons.find((lesson) => lesson.id === lessonId))
		.filter((lesson): lesson is LessonOption => Boolean(lesson))
	const availableLessons = lessons.filter(
		(lesson) => !course.lessonIds.includes(lesson.id)
	)

	function addLesson(lessonId: string) {
		if (lessonId === 'none') return

		setCourse((current) =>
			current.lessonIds.includes(lessonId)
				? current
				: { ...current, lessonIds: [...current.lessonIds, lessonId] }
		)
	}

	function removeLesson(lessonId: string) {
		setCourse((current) => ({
			...current,
			lessonIds: current.lessonIds.filter((id) => id !== lessonId),
		}))
	}

	function handleLessonDragEnd(event: DragEndEvent) {
		const { active, over } = event
		if (!over || active.id === over.id) return

		setCourse((current) => {
			const oldIndex = current.lessonIds.indexOf(String(active.id))
			const newIndex = current.lessonIds.indexOf(String(over.id))

			if (oldIndex === -1 || newIndex === -1) return current

			return {
				...current,
				lessonIds: arrayMove(current.lessonIds, oldIndex, newIndex),
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
							Add lessons to this course and drag them into the course-specific
							order students should see.
						</p>
					</div>
					{!readOnly ? (
						<div className="grid gap-3 rounded-2xl border border-dashed p-4 md:grid-cols-[1fr_auto] md:items-end">
							<div className="space-y-2">
								<Label>Add Existing Lesson</Label>
								<Select value="none" onValueChange={addLesson}>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Choose a lesson to add" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">Choose a lesson</SelectItem>
										{availableLessons.map((lesson) => (
											<SelectItem key={lesson.id} value={lesson.id}>
												{lesson.number}
												{lesson.part ? ` ${lesson.part}` : ''}. {lesson.title}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<p className="text-sm text-muted-foreground">
								{availableLessons.length} available
							</p>
						</div>
					) : null}

					<div className="space-y-2 rounded-2xl border border-border/70 bg-background/60 p-3">
						{selectedLessons.length ? (
							<DndContext
								sensors={sensors}
								collisionDetection={closestCenter}
								onDragEnd={handleLessonDragEnd}
							>
								<SortableContext
									items={course.lessonIds}
									strategy={verticalListSortingStrategy}
								>
									<div className="space-y-2">
										{selectedLessons.map((lesson, index) => (
											<SortableLessonRow
												key={lesson.id}
												lesson={lesson}
												index={index}
												readOnly={readOnly}
												onRemove={removeLesson}
											/>
										))}
									</div>
								</SortableContext>
							</DndContext>
						) : null}

						{selectedLessons.length === 0 ? (
							<p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
								No lessons are assigned to this course yet.
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

function SortableLessonRow({
	lesson,
	index,
	readOnly,
	onRemove,
}: {
	lesson: LessonOption
	index: number
	readOnly: boolean
	onRemove: (lessonId: string) => void
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id: lesson.id,
		disabled: readOnly,
	})
	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	}

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={[
				'flex items-center gap-3 rounded-xl border border-border/70 bg-card p-3 shadow-sm',
				isDragging ? 'z-10 border-primary/60 shadow-lg' : '',
			].join(' ')}
		>
			<button
				type="button"
				disabled={readOnly}
				className="cursor-grab rounded-lg border border-border/70 p-2 text-muted-foreground disabled:cursor-default disabled:opacity-40"
				aria-label={`Drag ${lesson.title}`}
				{...attributes}
				{...listeners}
			>
				<GripVertical className="h-4 w-4" />
			</button>
			<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
				{index + 1}
			</div>
			<div className="min-w-0 flex-1">
				<p className="truncate text-sm font-semibold">
					{lesson.number}
					{lesson.part ? ` ${lesson.part}` : ''}. {lesson.title}
				</p>
			</div>
			{!readOnly ? (
				<Button
					type="button"
					variant="outline"
					size="icon"
					className="h-8 w-8"
					onClick={() => onRemove(lesson.id)}
					aria-label={`Remove ${lesson.title}`}
				>
					<Trash2 className="h-4 w-4" />
				</Button>
			) : null}
		</div>
	)
}
