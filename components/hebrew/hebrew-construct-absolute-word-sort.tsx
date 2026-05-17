'use client'

import { useEffect, useMemo, useState } from 'react'
import {
	DndContext,
	DragEndEvent,
	DragOverlay,
	MouseSensor,
	TouchSensor,
	useDraggable,
	useDroppable,
	useSensor,
	useSensors,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Check, RotateCcw } from 'lucide-react'

import LessonFilter from '@/components/filters/filter-lesson'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLessonCards } from '@/hooks/useLessonCards'
import type { ConstructAbsoluteWord } from '@/lib/data/hebrew/construct-absolute'
import { cn } from '@/lib/utils'

type SortBucket = 'absolute' | 'construct'

type SortWord = {
	id: string
	hebrew: string
	type: SortBucket
}

const hebrewWordCollator = new Intl.Collator('he', {
	numeric: true,
	sensitivity: 'base',
})

function shuffle<T>(items: T[]) {
	return [...items].sort(() => Math.random() - 0.5)
}

function sortWordsAlphabetically(words: SortWord[]) {
	return [...words].sort(
		(a, b) =>
			hebrewWordCollator.compare(a.hebrew, b.hebrew) ||
			a.id.localeCompare(b.id)
	)
}

function DraggableWord({
	word,
	disabled = false,
}: {
	word: SortWord
	disabled?: boolean
}) {
	const { attributes, listeners, setNodeRef, transform, isDragging } =
		useDraggable({
			id: word.id,
			disabled,
		})

	const style = {
		transform: CSS.Translate.toString(transform),
	}

	return (
		<button
			ref={setNodeRef}
			style={style}
			type="button"
			{...listeners}
			{...attributes}
			className={cn(
				'rounded-2xl border border-sidebar-border bg-white/95 px-4 py-3 text-right shadow-sm transition',
				'hover:border-sidebar-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
				isDragging && 'opacity-0',
				disabled && 'cursor-default opacity-60'
			)}
		>
			<p className="font-cardo text-3xl leading-none text-neutral-800">
				{word.hebrew}
			</p>
		</button>
	)
}

function DropZone({
	id,
	label,
	description,
	words,
	tone,
}: {
	id: SortBucket
	label: string
	description: string
	words: SortWord[]
	tone: 'amber' | 'sky'
}) {
	const { setNodeRef, isOver } = useDroppable({ id })

	return (
		<div ref={setNodeRef}>
			<Card
				className={cn(
					'min-h-[320px] border-2 border-dashed bg-white/80 shadow-sm transition',
					tone === 'amber' && 'border-amber-300',
					tone === 'sky' && 'border-sky-300',
					isOver && tone === 'amber' && 'border-amber-500 bg-amber-50/80 shadow-md',
					isOver && tone === 'sky' && 'border-sky-500 bg-sky-50/80 shadow-md'
				)}
			>
				<CardHeader className="pb-4">
					<CardTitle className="text-2xl font-cardo text-neutral-800">
						{label}
					</CardTitle>
					<p className="text-sm leading-6 text-neutral-600">{description}</p>
				</CardHeader>
				<CardContent className="space-y-3">
					{words.length ? (
						words.map((word) => (
							<div
								key={word.id}
								className="rounded-2xl border border-sidebar-border bg-sidebar-accent/30 p-4"
							>
								<p className="font-cardo text-3xl text-neutral-800">
									{word.hebrew}
								</p>
							</div>
						))
					) : (
						<div className="flex min-h-[160px] items-center justify-center rounded-2xl border border-dashed border-sidebar-border/80 bg-sidebar-accent/10 px-6 text-center text-sm leading-6 text-neutral-500">
							Drop words here.
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}

export default function HebrewConstructAbsoluteWordSort({
	words,
	currentLesson,
}: {
	words: ConstructAbsoluteWord[]
	currentLesson: string
}) {
	const lessonFilterData = useMemo(
		() =>
			words.map((word) => ({
				lessons: word.lessonNumber ? [word.lessonNumber] : [],
			})),
		[words]
	)

	const { selectedLessons, setSelectedLessons } = useLessonCards(
		lessonFilterData,
		currentLesson
	)

	const filteredWords = useMemo(
		() =>
			words.filter(
				(word) =>
					selectedLessons.length === 0 ||
					selectedLessons.includes(word.lessonNumber)
			),
		[words, selectedLessons]
	)

	const allCards = useMemo<SortWord[]>(
		() =>
			filteredWords.flatMap((word) => [
				{
					id: `${word.id}-absolute`,
					hebrew: word.absolute,
					type: 'absolute' as const,
				},
				{
					id: `${word.id}-construct`,
					hebrew: word.construct,
					type: 'construct' as const,
				},
			]),
		[filteredWords]
	)

	const [deck, setDeck] = useState(() => shuffle(allCards))
	const [placements, setPlacements] = useState<Record<string, SortBucket>>({})
	const [activeId, setActiveId] = useState<string | null>(null)

	useEffect(() => {
		setDeck(shuffle(allCards))
		setPlacements({})
		setActiveId(null)
	}, [allCards])

	const sensors = useSensors(
		useSensor(MouseSensor, {
			activationConstraint: { distance: 6 },
		}),
		useSensor(TouchSensor, {
			activationConstraint: { delay: 120, tolerance: 8 },
		})
	)

	const unsortedWords = useMemo(
		() => deck.filter((word) => !placements[word.id]),
		[deck, placements]
	)

	const absoluteWords = useMemo(
		() =>
			sortWordsAlphabetically(
				deck.filter((word) => placements[word.id] === 'absolute')
			),
		[deck, placements]
	)

	const constructWords = useMemo(
		() =>
			sortWordsAlphabetically(
				deck.filter((word) => placements[word.id] === 'construct')
			),
		[deck, placements]
	)

	const sortedCount = absoluteWords.length + constructWords.length
	const correctCount = deck.filter((word) => placements[word.id] === word.type).length
	const isComplete = sortedCount === deck.length

	function resetGame() {
		setDeck(shuffle(allCards))
		setPlacements({})
		setActiveId(null)
	}

	function handleDragEnd(event: DragEndEvent) {
		setActiveId(null)

		const { active, over } = event
		if (!over) return

		const word = deck.find((entry) => entry.id === String(active.id))
		const bucket =
			over.id === 'absolute' || over.id === 'construct' ? over.id : null

		if (!word || !bucket) return
		if (word.type !== bucket) return

		setPlacements((current) => ({
			...current,
			[word.id]: bucket,
		}))
	}

	const activeWord = activeId
		? deck.find((word) => word.id === activeId) ?? null
		: null

	return (
		<div className="w-full max-w-6xl space-y-6">
			<LessonFilter
				data={lessonFilterData}
				selectedLessons={selectedLessons}
				setSelectedLessons={setSelectedLessons}
				showRanges
			/>

			<Card className="border-sidebar-border bg-white/85 shadow-sm">
				<CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
					<div className="grid gap-4 sm:grid-cols-3">
						<div>
							<p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500">
								Progress
							</p>
							<p className="mt-1 text-3xl font-extrabold tracking-tight text-neutral-800">
								{sortedCount}/{deck.length}
							</p>
						</div>
						<div>
							<p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500">
								Correct
							</p>
							<p className="mt-1 text-3xl font-extrabold tracking-tight text-neutral-800">
								{correctCount}
							</p>
						</div>
						<div>
							<p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500">
								Status
							</p>
							<p className="mt-1 text-lg font-bold text-neutral-700">
								{isComplete ? 'All sorted' : 'Keep sorting'}
							</p>
						</div>
					</div>

					<Button
						type="button"
						variant="secondary"
						className="gap-2 self-start md:self-auto"
						onClick={resetGame}
					>
						<RotateCcw className="h-4 w-4" />
						Reset
					</Button>
				</CardContent>
			</Card>

			<DndContext
				sensors={sensors}
				onDragStart={({ active }) => setActiveId(String(active.id))}
				onDragEnd={handleDragEnd}
				onDragCancel={() => setActiveId(null)}
			>
				<div className="space-y-6">
					<Card className="border-sidebar-border bg-white/85 shadow-sm">
						<CardHeader className="pb-4">
							<CardTitle className="text-2xl text-neutral-800">
								Word Bank
							</CardTitle>
							<p className="text-sm leading-6 text-neutral-600">
								Drag each word into the correct state. This deck grows as
								more lesson words unlock, and a word only locks in when it lands
								in the right place.
							</p>
						</CardHeader>
						<CardContent>
							{unsortedWords.length ? (
								<div className="flex flex-wrap justify-end gap-3">
									{unsortedWords.map((word) => (
										<DraggableWord key={word.id} word={word} />
									))}
								</div>
							) : (
								<div className="flex min-h-[160px] flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/80 px-6 text-center">
									<Check className="h-10 w-10 text-emerald-600" />
									<p className="mt-4 text-lg font-bold text-emerald-800">
										Everything is sorted.
									</p>
									<p className="mt-2 max-w-sm text-sm leading-6 text-emerald-700">
										Nice work. Reset to shuffle a fresh round of the same forms.
									</p>
								</div>
							)}
						</CardContent>
					</Card>

					<div className="grid gap-6 md:grid-cols-2">
						<DropZone
							id="absolute"
							label="Absolute"
							description="Absolute-state words can stand on their own as the regular citation form."
							words={absoluteWords}
							tone="amber"
						/>

						<DropZone
							id="construct"
							label="Construct"
							description="Construct-state words are bound to what follows and often feel incomplete by themselves."
							words={constructWords}
							tone="sky"
						/>
					</div>
				</div>

				<DragOverlay>
					{activeWord ? (
						<div className="w-[280px] max-w-[80vw]">
							<DraggableWord word={activeWord} disabled />
						</div>
					) : null}
				</DragOverlay>
			</DndContext>
		</div>
	)
}
