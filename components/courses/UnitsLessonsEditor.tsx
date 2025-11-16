// components/courses/UnitsLessonsEditor.tsx
'use client'

import * as React from 'react'
import {
	DndContext,
	DragEndEvent,
	DragStartEvent,
	PointerSensor,
	useSensor,
	useSensors,
} from '@dnd-kit/core'
import {
	SortableContext,
	useSortable,
	arrayMove,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Pencil } from 'lucide-react'

export type LessonForm = {
	id?: string
	slug: string
	lessonNumber: string
	description: string
}

export type UnitForm = {
	id?: string
	slug: string
	description?: string | null
	lessons: LessonForm[]
}

interface UnitsLessonsEditorProps {
	value: UnitForm[]
	onChange: (next: UnitForm[]) => void
	disabled?: boolean
	onEditLesson?: (lessonId: string) => void
}

type DragMeta =
	| { kind: 'unit'; unitIndex: number }
	| { kind: 'lesson'; unitIndex: number; lessonIndex: number }

export function UnitsLessonsEditor({
	value,
	onChange,
	disabled,
	onEditLesson,
}: UnitsLessonsEditorProps) {
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 5 },
		})
	)

	const [activeId, setActiveId] = React.useState<string | null>(null)

	// Build a map from draggable id → its location/type
	const idToMeta = React.useMemo(() => {
		const map = new Map<string, DragMeta>()

		value.forEach((unit, uIdx) => {
			const unitId = getUnitKey(unit, uIdx)
			map.set(unitId, { kind: 'unit', unitIndex: uIdx })

			unit.lessons.forEach((lesson, lIdx) => {
				const lessonId = getLessonKey(unit, uIdx, lesson, lIdx)
				map.set(lessonId, {
					kind: 'lesson',
					unitIndex: uIdx,
					lessonIndex: lIdx,
				})
			})
		})

		return map
	}, [value])

	function handleDragStart(event: DragStartEvent) {
		setActiveId(String(event.active.id))
	}

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event
		setActiveId(null)

		if (!over) return
		const activeKey = String(active.id)
		const overKey = String(over.id)
		if (activeKey === overKey) return

		const activeMeta = idToMeta.get(activeKey)
		const overMeta = idToMeta.get(overKey)
		if (!activeMeta || !overMeta) return

		// ---------------------------
		// UNIT → UNIT reordering
		// ---------------------------
		if (activeMeta.kind === 'unit' && overMeta.kind === 'unit') {
			if (activeMeta.unitIndex === overMeta.unitIndex) return

			const next = arrayMove(value, activeMeta.unitIndex, overMeta.unitIndex)
			onChange(next)
			return
		}

		// ---------------------------
		// LESSON drag
		// ---------------------------
		if (activeMeta.kind === 'lesson') {
			const sourceUnitIndex = activeMeta.unitIndex
			const sourceLessonIndex = activeMeta.lessonIndex
			const sourceUnit = value[sourceUnitIndex]
			const lesson = sourceUnit.lessons[sourceLessonIndex]

			// Determine target unit + index
			const targetUnitIndex = overMeta.unitIndex
			let targetLessonIndex: number

			if (overMeta.kind === 'lesson') {
				targetLessonIndex = overMeta.lessonIndex
			} else {
				// Dropped on the unit header → append to end
				targetLessonIndex = value[targetUnitIndex].lessons.length
			}

			const next = structuredClone(value) as UnitForm[]

			// Remove from source
			next[sourceUnitIndex].lessons.splice(sourceLessonIndex, 1)

			// Adjust target index if we removed from same unit and above target
			if (
				sourceUnitIndex === targetUnitIndex &&
				sourceLessonIndex < targetLessonIndex
			) {
				targetLessonIndex = targetLessonIndex - 1
			}

			// Insert into target
			next[targetUnitIndex].lessons.splice(targetLessonIndex, 0, lesson)

			onChange(next)
		}
	}

	function addUnit() {
		const next: UnitForm[] = [
			...value,
			{
				slug: `unit-${value.length + 1}`,
				description: '',
				lessons: [],
			},
		]
		onChange(next)
	}

	function removeUnit(index: number) {
		const next = [...value]
		next.splice(index, 1)
		onChange(next)
	}

	function updateUnitField(
		index: number,
		field: keyof UnitForm,
		val: string | null
	) {
		const next = [...value]
		;(next[index] as any)[field] = val
		onChange(next)
	}

	function addLesson(unitIndex: number) {
		const next = [...value]
		const unit = next[unitIndex]
		const nextNum = (unit.lessons.length + 1).toString()

		unit.lessons = [
			...unit.lessons,
			{
				slug: `lesson-${nextNum}`,
				lessonNumber: nextNum,
				description: '',
			},
		]

		onChange(next)
	}

	function removeLesson(unitIndex: number, lessonIndex: number) {
		const next = [...value]
		next[unitIndex].lessons.splice(lessonIndex, 1)
		onChange(next)
	}

	function updateLessonField(
		unitIndex: number,
		lessonIndex: number,
		field: keyof LessonForm,
		val: string
	) {
		const next = [...value]
		;(next[unitIndex].lessons[lessonIndex] as any)[field] = val
		onChange(next)
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="text-xl font-semibold">Curriculum</h2>

				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={addUnit}
					disabled={disabled}
				>
					Add Unit
				</Button>
			</div>

			{value.length === 0 && (
				<p className="text-sm text-muted-foreground">
					No units yet. Click &ldquo;Add Unit&rdquo; to create one.
				</p>
			)}

			<DndContext
				sensors={sensors}
				onDragStart={handleDragStart}
				onDragEnd={handleDragEnd}
			>
				<SortableContext
					items={value.map((u, i) => getUnitKey(u, i))}
					strategy={verticalListSortingStrategy}
				>
					<div className="space-y-3">
						{value.map((unit, unitIndex) => (
							<UnitCard
								key={getUnitKey(unit, unitIndex)}
								id={getUnitKey(unit, unitIndex)}
								unit={unit}
								unitIndex={unitIndex}
								disabled={disabled}
								onRemove={() => removeUnit(unitIndex)}
								onChangeField={(field, v) =>
									updateUnitField(unitIndex, field, v)
								}
								onAddLesson={() => addLesson(unitIndex)}
								onRemoveLesson={(lessonIndex) =>
									removeLesson(unitIndex, lessonIndex)
								}
								onChangeLessonField={(lessonIndex, field, v) =>
									updateLessonField(unitIndex, lessonIndex, field, v)
								}
								onEditLesson={onEditLesson}
							/>
						))}
					</div>
				</SortableContext>
			</DndContext>
		</div>
	)
}

function getUnitKey(unit: UnitForm, index: number) {
	return unit.id ?? `unit-${index}`
}

function getLessonKey(
	unit: UnitForm,
	unitIndex: number,
	lesson: LessonForm,
	lessonIndex: number
) {
	return lesson.id ?? `lesson-${unitIndex}-${lessonIndex}`
}

// -----------------------
// Sortable Unit Card
// -----------------------

interface UnitCardProps {
	id: string
	unit: UnitForm
	unitIndex: number
	disabled?: boolean
	onRemove: () => void
	onChangeField: (field: keyof UnitForm, val: string | null) => void
	onAddLesson: () => void
	onRemoveLesson: (lessonIndex: number) => void
	onChangeLessonField: (
		lessonIndex: number,
		field: keyof LessonForm,
		val: string
	) => void
	onEditLesson?: (lessonId: string) => void
}

function UnitCard({
	id,
	unit,
	unitIndex,
	disabled,
	onRemove,
	onChangeField,
	onAddLesson,
	onRemoveLesson,
	onChangeLessonField,
	onEditLesson,
}: UnitCardProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id })

	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.6 : 1,
	}

	return (
		<Card
			ref={setNodeRef}
			style={style}
			className={cn(
				'border border-dashed border-muted-foreground/40 p-3 space-y-3 bg-background',
				isDragging && 'ring-2 ring-primary/50'
			)}
		>
			<div className="flex items-center gap-2">
				<button
					type="button"
					className="cursor-grab text-muted-foreground text-xs px-2 py-1 border rounded"
					{...attributes}
					{...listeners}
				>
					☰
				</button>

				<div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
					<div>
						<label className="text-xs font-medium text-muted-foreground">
							Unit Slug
						</label>
						<Input
							value={unit.slug}
							onChange={(e) => onChangeField('slug', e.target.value)}
							disabled={disabled}
							className="mt-1"
						/>
					</div>

					<div>
						<label className="text-xs font-medium text-muted-foreground">
							Description
						</label>
						<Input
							value={unit.description ?? ''}
							onChange={(e) =>
								onChangeField(
									'description',
									e.target.value.length ? e.target.value : null
								)
							}
							disabled={disabled}
							className="mt-1"
						/>
					</div>
				</div>

				<Button
					type="button"
					variant="ghost"
					size="icon"
					onClick={onRemove}
					disabled={disabled}
				>
					✕
				</Button>
			</div>

			{/* Lessons inside this unit */}
			<SortableContext
				items={unit.lessons.map((lesson, lIdx) =>
					getLessonKey(unit, unitIndex, lesson, lIdx)
				)}
				strategy={verticalListSortingStrategy}
			>
				<div className="space-y-2 pl-8">
					{unit.lessons.map((lesson, lessonIndex) => (
						<LessonRow
							key={getLessonKey(unit, unitIndex, lesson, lessonIndex)}
							id={getLessonKey(unit, unitIndex, lesson, lessonIndex)}
							lesson={lesson}
							lessonIndex={lessonIndex}
							disabled={disabled}
							onRemove={() => onRemoveLesson(lessonIndex)}
							onChangeField={(field, v) =>
								onChangeLessonField(lessonIndex, field, v)
							}
							onEdit={() => onEditLesson?.(lesson.id!)}
						/>
					))}
				</div>
			</SortableContext>

			<div className="pl-8">
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={onAddLesson}
					disabled={disabled}
				>
					Add Lesson
				</Button>
			</div>
		</Card>
	)
}

// -----------------------
// Sortable Lesson Row
// -----------------------

interface LessonRowProps {
	id: string
	lesson: LessonForm
	lessonIndex: number
	disabled?: boolean
	onRemove: () => void
	onChangeField: (field: keyof LessonForm, val: string) => void
	onEdit?: () => void
}

function LessonRow({
	id,
	lesson,
	lessonIndex,
	disabled,
	onRemove,
	onChangeField,
	onEdit,
}: LessonRowProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id })

	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.6 : 1,
	}

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={cn(
				'flex items-center gap-2 border rounded-md p-2 bg-muted/40',
				isDragging && 'ring-1 ring-primary/40'
			)}
		>
			<button
				type="button"
				className="cursor-grab text-muted-foreground text-xs px-2 py-1 border rounded"
				{...attributes}
				{...listeners}
			>
				≡
			</button>

			<span className="text-xs text-muted-foreground w-6">
				{lessonIndex + 1}.
			</span>

			<div className="flex-1 grid grid-cols-2 gap-2">
				<div>
					<label className="text-xs font-medium text-muted-foreground">
						Lesson #
					</label>
					<Input
						value={lesson.lessonNumber}
						onChange={(e) => onChangeField('lessonNumber', e.target.value)}
						disabled={disabled}
						className="mt-1"
					/>
				</div>

				<div>
					<label className="text-xs font-medium text-muted-foreground">
						Lesson Slug
					</label>
					<Input
						value={lesson.slug}
						onChange={(e) => onChangeField('slug', e.target.value)}
						disabled={disabled}
						className="mt-1"
					/>
				</div>
				<div>
					<label className="text-xs font-medium text-muted-foreground">
						Description
					</label>
					<Input
						value={lesson.description ?? ''}
						onChange={(e) => onChangeField('description', e.target.value)}
						disabled={disabled}
						className="mt-1"
					/>
				</div>
			</div>
			<Button
				type="button"
				variant="ghost"
				size="icon"
				onClick={onEdit}
				disabled={disabled || !lesson.id}
			>
				<Pencil className="h-4 w-4" />
			</Button>

			<Button
				type="button"
				variant="ghost"
				size="icon"
				onClick={onRemove}
				disabled={disabled}
			>
				✕
			</Button>
		</div>
	)
}
