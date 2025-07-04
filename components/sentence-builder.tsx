'use client'

import { phrases } from '@/lib/sentence-builder-phrases'
import { vocab } from '@/lib/sentence-builder-specifics'
import { useState, useMemo } from 'react'
import {
	DndContext,
	closestCenter,
	DragOverlay,
	useSensor,
	useSensors,
	PointerSensor,
	useDroppable,
	useDraggable,
} from '@dnd-kit/core'
import {
	arrayMove,
	SortableContext,
	verticalListSortingStrategy,
	useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface VocabWord {
	id: number
	word: string
	gender: 'm' | 'f' | 'mf'
	quantity: 's' | 'p'
	type: 'noun' | 'adjective' | 'demonstrative'
}

export default function SentenceBuilder() {
	const [builtSentence, setBuiltSentence] = useState<number[]>([])
	const [activeId, setActiveId] = useState<number | null>(null)
	const [match, setMatch] = useState<string | null>(null)
	const [filterQuantity, setFilterQuantity] = useState<'all' | 's' | 'p'>('s')

	const sensors = useSensors(useSensor(PointerSensor))

	const groupedWords = useMemo(() => {
		function applyQuantityFilter(words: VocabWord[]) {
			if (filterQuantity === 'all') return words
			return words.filter((w) => w.quantity === filterQuantity)
		}

		return {
			'Masc. Sing.': applyQuantityFilter(
				vocab.filter(
					(v) => v.gender === 'm' && v.quantity === 's' && v.type === 'noun'
				)
			),
			'Masc. Plural': applyQuantityFilter(
				vocab.filter(
					(v) => v.gender === 'm' && v.quantity === 'p' && v.type === 'noun'
				)
			),
			'Fem. Sing.': applyQuantityFilter(
				vocab.filter(
					(v) => v.gender === 'f' && v.quantity === 's' && v.type === 'noun'
				)
			),
			'Fem. Plural': applyQuantityFilter(
				vocab.filter(
					(v) => v.gender === 'f' && v.quantity === 'p' && v.type === 'noun'
				)
			),
			Adjectives: applyQuantityFilter(
				vocab.filter((v) => v.type === 'adjective')
			),
			Demonstratives: applyQuantityFilter(
				vocab.filter((v) => v.type === 'demonstrative')
			),
		}
	}, [filterQuantity])

	function normalize(text: string) {
		return text.normalize('NFKC').replace(/[\u0591-\u05BD\u05BF-\u05C7]/g, '')
	}

	function handleUpdate(newSentence: number[]) {
		setBuiltSentence(newSentence)
		const words = newSentence
			.slice()
			.reverse()
			.map((id) => vocab.find((v) => v.id === id)?.word || '')
			.join(' ')
		const found = phrases.find(
			(p) => normalize(p.hebrew) === normalize(words.trim())
		)
		setMatch(found?.english ?? null)
	}

	function handleClear() {
		setBuiltSentence([])
		setMatch(null)
	}

	function handleWordClick(id: number) {
		if (!builtSentence.includes(id)) {
			handleUpdate([id, ...builtSentence]) // ➕ Add to end of array (which becomes rightmost visually in RTL)
		}
	}

	function handleWordRemove(id: number) {
		const newSentence = builtSentence.filter((wordId) => wordId !== id)
		handleUpdate(newSentence)
	}

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragStart={({ active }) => {
				setActiveId(active.id as number)
			}}
			onDragEnd={({ active, over }) => {
				setActiveId(null)
				if (!over) return

				const activeId = active.id as number
				const overId = over.id

				// 🧼 If dragged onto itself, do nothing
				if (activeId === overId) return

				const oldIndex = builtSentence.indexOf(activeId)

				// 🔁 Reorder if dropped on another word
				if (typeof overId === 'number') {
					const newIndex = builtSentence.indexOf(overId)
					if (oldIndex !== -1 && newIndex !== -1) {
						handleUpdate(arrayMove(builtSentence, oldIndex, newIndex))
						return
					}
					// ➕ Add new word into sentence
					if (oldIndex === -1 && newIndex !== -1) {
						handleUpdate([
							...builtSentence.slice(0, newIndex),
							activeId,
							...builtSentence.slice(newIndex),
						])
						return
					}
				}

				// ➕ Add to beginning if dropped on sentence area
				if (typeof overId === 'string' && overId === 'sentence-drop') {
					if (!builtSentence.includes(activeId)) {
						handleUpdate([activeId, ...builtSentence])
					}
					return
				}

				// 🧼 Remove if dropped back on word bank
				if (typeof overId === 'string' && overId === 'word-bank') {
					handleUpdate(builtSentence.filter((id) => id !== activeId))
					return
				}
			}}
		>
			<div className="max-w-6xl mx-auto p-4 space-y-6">
				<SortableContext
					items={builtSentence}
					strategy={verticalListSortingStrategy}
				>
					<DropZone sentence={builtSentence} onWordRemove={handleWordRemove} />
				</SortableContext>

				{match && (
					<p className="text-xl text-green-600 font-semibold">✓ {match}</p>
				)}

				<button
					onClick={handleClear}
					className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
				>
					Clear
				</button>
				<div className="flex gap-2 mb-4">
					<button
						className={`px-3 py-1 rounded border ${
							filterQuantity === 'all' ? 'bg-blue-500 text-white' : 'bg-white'
						}`}
						onClick={() => setFilterQuantity('all')}
					>
						All
					</button>
					<button
						className={`px-3 py-1 rounded border ${
							filterQuantity === 's' ? 'bg-blue-500 text-white' : 'bg-white'
						}`}
						onClick={() => setFilterQuantity('s')}
					>
						Singular
					</button>
					<button
						className={`px-3 py-1 rounded border ${
							filterQuantity === 'p' ? 'bg-blue-500 text-white' : 'bg-white'
						}`}
						onClick={() => setFilterQuantity('p')}
					>
						Plural
					</button>
				</div>

				<div
					id="word-bank"
					className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-6 text-center"
				>
					{Object.entries(groupedWords)
						.filter(([title]) => {
							const lower = title.toLowerCase()

							if (filterQuantity === 's') {
								return !lower.includes('plural') // only show singular + adj/dem
							}

							if (filterQuantity === 'p') {
								return (
									lower.includes('plural') ||
									lower === 'adjectives' ||
									lower === 'demonstratives'
								)
							}

							return true // show all
						})
						.map(([title, words]) => (
							<WordColumn
								key={title}
								title={title}
								words={words}
								usedIds={new Set(builtSentence)}
								onWordClick={handleWordClick}
							/>
						))}
				</div>
			</div>

			<DragOverlay>
				{activeId && (
					<DraggablePreview
						word={vocab.find((v) => v.id === activeId)?.word || ''}
					/>
				)}
			</DragOverlay>
		</DndContext>
	)
}

function DropZone({
	sentence,
	onWordRemove,
}: {
	sentence: number[]
	onWordRemove: (id: number) => void
}) {
	const { setNodeRef, isOver } = useDroppable({ id: 'sentence-drop' })

	return (
		<div
			ref={setNodeRef}
			className={`min-h-[80px] p-4 bg-gray-50 border rounded text-3xl font-serif text-right flex flex-wrap gap-2 transition-colors duration-200 ${
				isOver ? 'bg-green-100' : ''
			}`}
			dir="rtl"
		>
			{sentence
				.slice()
				.reverse()
				.map((id) => (
					<SortableWord key={id} id={id} onRemove={onWordRemove} />
				))}
		</div>
	)
}

function WordColumn({
	title,
	words,
	usedIds,
	onWordClick,
}: {
	title: string
	words: VocabWord[]
	usedIds: Set<number>
	onWordClick: (id: number) => void
}) {
	return (
		<div>
			<h2 className="mb-2 font-semibold text-sm">{title}</h2>
			{words
				.filter((w) => !usedIds.has(w.id))
				.map((w) => (
					<DraggableWord
						key={w.id}
						id={w.id}
						word={w.word}
						gender={w.gender}
						onClick={onWordClick}
					/>
				))}
		</div>
	)
}

function DraggableWord({
	id,
	word,
	gender,
	onClick,
}: {
	id: number
	word: string
	gender: 'm' | 'f' | 'mf'
	onClick?: (id: number) => void
}) {
	const { attributes, listeners, setNodeRef, transform, isDragging } =
		useDraggable({
			id,
			data: { id },
		})

	const color =
		gender === 'm'
			? 'bg-blue-200'
			: gender === 'f'
			? 'bg-pink-200'
			: 'bg-yellow-200'

	return (
		<div
			ref={setNodeRef}
			{...listeners}
			{...attributes}
			onClick={() => onClick?.(id)} // 🟡 Add this line
			className={`mb-2 px-2 py-1 rounded text-3xl font-serif text-center cursor-pointer ${color}`}
			style={{
				transform: CSS.Translate.toString(transform),
				opacity: isDragging ? 0.5 : 1,
				position: 'relative',
				zIndex: isDragging ? 50 : 'auto',
			}}
		>
			{word}
		</div>
	)
}

function SortableWord({
	id,
	onRemove,
}: {
	id: number
	onRemove: (id: number) => void
}) {
	const { attributes, setNodeRef, transform, transition, listeners } =
		useSortable({ id })
	const word = vocab.find((v) => v.id === id)?.word || ''

	let pointerDownTime = 0
	let startX = 0
	let startY = 0
	let dragTimeout: NodeJS.Timeout

	function handlePointerDown(e: React.PointerEvent) {
		pointerDownTime = Date.now()
		startX = e.clientX
		startY = e.clientY

		// Delay attaching the drag listener to distinguish click from drag
		dragTimeout = setTimeout(() => {
			listeners?.onPointerDown?.(e)
		}, 150)
	}

	function handlePointerUp(e: React.PointerEvent) {
		clearTimeout(dragTimeout)

		const elapsed = Date.now() - pointerDownTime
		const moved =
			Math.abs(e.clientX - startX) > 5 || Math.abs(e.clientY - startY) > 5

		if (elapsed < 200 && !moved) {
			e.stopPropagation()
			onRemove(id)
		}
	}

	return (
		<div
			ref={setNodeRef}
			{...attributes}
			className="px-3 py-1 bg-white border rounded shadow text-3xl hover:bg-red-100 cursor-pointer select-none"
			style={{
				transform: CSS.Transform.toString(transform),
				transition,
			}}
			onPointerDown={handlePointerDown}
			onPointerUp={handlePointerUp}
		>
			{word}
		</div>
	)
}

function DraggablePreview({ word }: { word: string }) {
	return (
		<div className="px-3 py-1 bg-gray-300 text-3xl rounded shadow border font-serif">
			{word}
		</div>
	)
}
