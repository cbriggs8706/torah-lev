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
import { GripVertical, Plus, Trash2 } from 'lucide-react'
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

type Option = {
	id: string
	title: string
}

type TargetLanguageOption = {
	id: string
	name: string
}

type ModuleOption = Option & {
	type: string
	quizId?: string | null
}

type LessonFormValue = {
	id?: string
	title: string
	number: number
	part: string
	sortOrder: number
	courseId: string | null
	organizationId: string | null
	targetLanguageId: string
	moduleIds: string[]
}

interface Props {
	locale: string
	mode: 'create' | 'read' | 'update'
	initialLesson?: LessonFormValue
	courses: Option[]
	organizations: Option[]
	targetLanguages: TargetLanguageOption[]
	modules: ModuleOption[]
	quizzes: Option[]
	showFooterActions?: boolean
}

export function LessonEditorForm({
	locale,
	mode,
	initialLesson,
	courses,
	organizations,
	targetLanguages,
	modules,
	quizzes,
	showFooterActions = true,
}: Props) {
	const router = useRouter()
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
	const [moduleOptions, setModuleOptions] = useState<ModuleOption[]>(modules)
	const [lesson, setLesson] = useState<LessonFormValue>(
		initialLesson ?? {
			title: '',
			number: 1,
			part: '',
			sortOrder: 0,
			courseId: courses[0]?.id ?? null,
			organizationId: null,
			targetLanguageId: targetLanguages[0]?.id ?? '',
			moduleIds: [],
		}
	)
	const selectedModules = lesson.moduleIds
		.map((moduleId) => moduleOptions.find((module) => module.id === moduleId))
		.filter((module): module is ModuleOption => Boolean(module))
	const availableModules = moduleOptions.filter(
		(module) => !lesson.moduleIds.includes(module.id)
	)
	const availableQuizzes = quizzes.filter((quiz) => {
		const selectedQuizIds = selectedModules
			.filter((module) => module.type === 'quiz')
			.map((module) => module.quizId)
		return !selectedQuizIds.includes(quiz.id)
	})

	function addModule(moduleId: string) {
		if (moduleId === 'none') return

		setLesson((current) =>
			current.moduleIds.includes(moduleId)
				? current
				: { ...current, moduleIds: [...current.moduleIds, moduleId] }
		)
	}

	function removeModule(moduleId: string) {
		setLesson((current) => ({
			...current,
			moduleIds: current.moduleIds.filter((id) => id !== moduleId),
		}))
	}

	async function addQuizAsModule(quizId: string) {
		if (quizId === 'none') return

		const quiz = quizzes.find((item) => item.id === quizId)
		if (!quiz) return

		const existingQuizModule = moduleOptions.find(
			(module) => module.type === 'quiz' && module.quizId === quizId
		)

		if (existingQuizModule) {
			addModule(existingQuizModule.id)
			return
		}

		setError(null)

		try {
			const res = await fetch('/api/admin/learning/modules', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: quiz.title,
					type: 'quiz',
					mediaAssetId: null,
					externalUrl: null,
					quizId,
				}),
			})

			if (!res.ok) {
				const body = await res.json().catch(() => null)
				throw new Error(body?.error || 'Unable to create quiz module')
			}

			const created = (await res.json()) as ModuleOption
			const quizModule = {
				id: created.id,
				title: created.title,
				type: created.type,
				quizId: created.quizId,
			}

			setModuleOptions((current) => [...current, quizModule])
			setLesson((current) => ({
				...current,
				moduleIds: [...current.moduleIds, quizModule.id],
			}))
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Unable to add quiz')
		}
	}

	function handleModuleDragEnd(event: DragEndEvent) {
		const { active, over } = event
		if (!over || active.id === over.id) return

		setLesson((current) => {
			const oldIndex = current.moduleIds.indexOf(String(active.id))
			const newIndex = current.moduleIds.indexOf(String(over.id))

			if (oldIndex === -1 || newIndex === -1) return current

			return {
				...current,
				moduleIds: arrayMove(current.moduleIds, oldIndex, newIndex),
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
					? '/api/admin/learning/lessons'
					: `/api/admin/learning/lessons/${lesson.id}`
			const method = mode === 'create' ? 'POST' : 'PATCH'
			const res = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(lesson),
			})

			if (!res.ok) {
				const body = await res.json().catch(() => null)
				throw new Error(body?.error || 'Unable to save lesson')
			}

			setStatus(mode === 'create' ? 'Lesson created' : 'Lesson saved')
			router.push(`/${locale}/admin/learning`)
			router.refresh()
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Unable to save lesson')
		} finally {
			setSaving(false)
		}
	}

	return (
		<div className="space-y-6 rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
			<div className="grid gap-4 md:grid-cols-2">
				<div className="space-y-2">
					<Label htmlFor="title">Title</Label>
					<Input
						id="title"
						value={lesson.title}
						disabled={readOnly}
						onChange={(e) =>
							setLesson((current) => ({ ...current, title: e.target.value }))
						}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="part">Part</Label>
					<Input
						id="part"
						value={lesson.part}
						disabled={readOnly}
						onChange={(e) =>
							setLesson((current) => ({ ...current, part: e.target.value }))
						}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="number">Number</Label>
					<Input
						id="number"
						type="number"
						value={lesson.number}
						disabled={readOnly}
						onChange={(e) =>
							setLesson((current) => ({
								...current,
								number: Number(e.target.value),
							}))
						}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="sortOrder">Sort Order</Label>
					<Input
						id="sortOrder"
						type="number"
						value={lesson.sortOrder}
						disabled={readOnly}
						onChange={(e) =>
							setLesson((current) => ({
								...current,
								sortOrder: Number(e.target.value),
							}))
						}
					/>
				</div>

				<div className="space-y-2">
					<Label>Course</Label>
					<Select
						value={lesson.courseId ?? 'none'}
						disabled={readOnly}
						onValueChange={(value) =>
							setLesson((current) => ({
								...current,
								courseId: value === 'none' ? null : value,
							}))
						}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Select course" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="none">No course</SelectItem>
							{courses.map((course) => (
								<SelectItem key={course.id} value={course.id}>
									{course.title}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-2">
					<Label>Target Language</Label>
					<Select
						value={lesson.targetLanguageId}
						disabled={readOnly}
						onValueChange={(value) =>
							setLesson((current) => ({
								...current,
								targetLanguageId: value,
							}))
						}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Select target language" />
						</SelectTrigger>
						<SelectContent>
							{targetLanguages.map((language) => (
								<SelectItem key={language.id} value={language.id}>
									{language.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-2 md:col-span-2">
					<Label>Organization</Label>
					<Select
						value={lesson.organizationId ?? 'none'}
						disabled={readOnly}
						onValueChange={(value) =>
							setLesson((current) => ({
								...current,
								organizationId: value === 'none' ? null : value,
							}))
						}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Optional organization" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="none">No organization</SelectItem>
							{organizations.map((organization) => (
								<SelectItem key={organization.id} value={organization.id}>
									{organization.title}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="space-y-4">
				<div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
					<div>
						<Label>Modules and Quizzes</Label>
						<p className="mt-1 text-sm text-muted-foreground">
							Add lesson modules, quiz modules, and drag them into the order
							students should complete them.
						</p>
					</div>
					{!readOnly ? (
						<div className="flex flex-wrap gap-2">
							<Button asChild type="button" variant="outline" size="sm">
								<Link href={`/${locale}/admin/learning/modules/create`}>
									<Plus className="h-4 w-4" />
									New Module
								</Link>
							</Button>
							<Button asChild type="button" variant="outline" size="sm">
								<Link href={`/${locale}/admin/learning/quizzes/create`}>
									<Plus className="h-4 w-4" />
									New Quiz
								</Link>
							</Button>
						</div>
					) : null}
				</div>

				{!readOnly ? (
					<div className="grid gap-3 rounded-2xl border border-dashed p-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label>Add Existing Module</Label>
							<Select value="none" onValueChange={addModule}>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Choose a module to add" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">Choose a module</SelectItem>
									{availableModules.map((module) => (
										<SelectItem key={module.id} value={module.id}>
											{module.title} ({module.type})
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<p className="text-xs text-muted-foreground">
								{availableModules.length} available modules
							</p>
						</div>
						<div className="space-y-2">
							<Label>Add Quiz</Label>
							<Select value="none" onValueChange={addQuizAsModule}>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Choose a quiz to assign" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">Choose a quiz</SelectItem>
									{availableQuizzes.map((quiz) => (
										<SelectItem key={quiz.id} value={quiz.id}>
											{quiz.title}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<p className="text-xs text-muted-foreground">
								{availableQuizzes.length} available quizzes
							</p>
						</div>
					</div>
				) : null}

				<div className="space-y-2 rounded-2xl border border-border/70 bg-background/60 p-3">
					{selectedModules.length ? (
						<DndContext
							sensors={sensors}
							collisionDetection={closestCenter}
							onDragEnd={handleModuleDragEnd}
						>
							<SortableContext
								items={lesson.moduleIds}
								strategy={verticalListSortingStrategy}
							>
								<div className="space-y-2">
									{selectedModules.map((module, index) => (
										<SortableModuleRow
											key={module.id}
											module={module}
											index={index}
											readOnly={readOnly}
											onRemove={removeModule}
										/>
									))}
								</div>
							</SortableContext>
						</DndContext>
					) : null}

					{selectedModules.length === 0 ? (
						<p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
							No modules are assigned yet. Add a module or quiz module to build
							the student sequence.
						</p>
					) : null}
				</div>
			</div>

			{status ? <p className="text-sm text-emerald-700">{status}</p> : null}
			{error ? <p className="text-sm text-destructive">{error}</p> : null}

			{showFooterActions ? (
				<div className="flex gap-3">
					<Button
						type="button"
						variant="outline"
						onClick={() => router.push(`/${locale}/admin/learning`)}
					>
						Back to lessons
					</Button>
					{!readOnly ? (
						<Button
							type="button"
							onClick={save}
							disabled={
								saving ||
								!lesson.title.trim() ||
								!lesson.targetLanguageId
							}
						>
							{saving ? 'Saving...' : 'Save Lesson'}
						</Button>
					) : null}
				</div>
			) : null}
		</div>
	)
}

function SortableModuleRow({
	module,
	index,
	readOnly,
	onRemove,
}: {
	module: ModuleOption
	index: number
	readOnly: boolean
	onRemove: (moduleId: string) => void
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id: module.id,
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
				aria-label={`Drag ${module.title}`}
				{...attributes}
				{...listeners}
			>
				<GripVertical className="h-4 w-4" />
			</button>
			<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
				{index + 1}
			</div>
			<div className="min-w-0 flex-1">
				<p className="truncate text-sm font-semibold">{module.title}</p>
				<p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
					{module.type}
				</p>
			</div>
			{!readOnly ? (
				<Button
					type="button"
					variant="outline"
					size="icon"
					className="h-8 w-8"
					onClick={() => onRemove(module.id)}
					aria-label={`Remove ${module.title}`}
				>
					<Trash2 className="h-4 w-4" />
				</Button>
			) : null}
		</div>
	)
}
