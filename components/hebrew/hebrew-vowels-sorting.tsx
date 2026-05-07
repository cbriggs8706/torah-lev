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
import { Check, RotateCcw, Shuffle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
	formatHebrewBankPieceDisplay,
	HEBREW_VOWEL_BANK_ITEMS,
	type HebrewVowelBankItem,
	type HebrewVowelClassBucket,
	type HebrewVowelLengthBucket,
} from '@/lib/data/hebrew/hebrew-vowel-bank'
import { cn } from '@/lib/utils'

type VowelMode = 'length' | 'class'
type SortBucket = HebrewVowelLengthBucket | HebrewVowelClassBucket

type BucketConfig = {
	id: SortBucket
	label: string
	description: string
	tone: 'amber' | 'sky' | 'emerald'
}

const MODE_OPTIONS: { id: VowelMode; label: string }[] = [
	{ id: 'length', label: 'Length' },
	{ id: 'class', label: 'Class' },
]

const BUCKETS_BY_MODE: Record<VowelMode, BucketConfig[]> = {
	length: [
		{
			id: 'short',
			label: 'Short',
			description: 'Quick vowels and reduced vowels go here.',
			tone: 'amber',
		},
		{
			id: 'long',
			label: 'Long',
			description: 'Long vowels and malei spellings go here.',
			tone: 'sky',
		},
	],
	class: [
		{
			id: 'a-class',
			label: 'A-Class',
			description: 'Open a-family vowels like patach and kamatz.',
			tone: 'amber',
		},
		{
			id: 'i-class',
			label: 'I-Class',
			description: 'Front vowels and reduced e-type vowels go here.',
			tone: 'sky',
		},
		{
			id: 'u-class',
			label: 'U-Class',
			description: 'Back rounded vowels like holam, kubutz, and shuruk.',
			tone: 'emerald',
		},
	],
}

const nameCollator = new Intl.Collator('en', {
	numeric: true,
	sensitivity: 'base',
})

function shuffle<T>(items: T[]) {
	return [...items].sort(() => Math.random() - 0.5)
}

function sortItems(items: HebrewVowelBankItem[]) {
	return [...items].sort(
		(a, b) => nameCollator.compare(a.name, b.name) || a.id.localeCompare(b.id)
	)
}

function getCorrectBucket(item: HebrewVowelBankItem, mode: VowelMode): SortBucket {
	return mode === 'length' ? item.lengthBucket : item.classBucket
}

function VowelChip({
	item,
	disabled = false,
}: {
	item: HebrewVowelBankItem
	disabled?: boolean
}) {
	const { attributes, listeners, setNodeRef, transform, isDragging } =
		useDraggable({
			id: item.id,
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
				'flex min-w-[132px] flex-col items-center rounded-2xl border border-sidebar-border bg-white/95 px-4 py-3 text-center shadow-sm transition',
				'hover:border-sidebar-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
				isDragging && 'opacity-0',
				disabled && 'cursor-default opacity-60'
			)}
		>
			<p dir="rtl" className="font-cardo text-4xl leading-none text-neutral-800">
				{formatHebrewBankPieceDisplay(item.text)}
			</p>
			<p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
				{item.name}
			</p>
		</button>
	)
}

function DropZone({
	bucket,
	items,
}: {
	bucket: BucketConfig
	items: HebrewVowelBankItem[]
}) {
	const { setNodeRef, isOver } = useDroppable({ id: bucket.id })

	return (
		<div ref={setNodeRef}>
			<Card
				className={cn(
					'min-h-[280px] border-2 border-dashed bg-white/80 shadow-sm transition',
					bucket.tone === 'amber' && 'border-amber-300',
					bucket.tone === 'sky' && 'border-sky-300',
					bucket.tone === 'emerald' && 'border-emerald-300',
					isOver && bucket.tone === 'amber' && 'border-amber-500 bg-amber-50/80 shadow-md',
					isOver && bucket.tone === 'sky' && 'border-sky-500 bg-sky-50/80 shadow-md',
					isOver && bucket.tone === 'emerald' && 'border-emerald-500 bg-emerald-50/80 shadow-md'
				)}
			>
				<CardHeader className="pb-4">
					<CardTitle className="text-2xl text-neutral-800">
						{bucket.label}
					</CardTitle>
					<p className="text-sm leading-6 text-neutral-600">
						{bucket.description}
					</p>
				</CardHeader>
				<CardContent>
					{items.length ? (
						<div className="flex flex-wrap gap-3">
							{items.map((item) => (
								<VowelChip key={item.id} item={item} disabled />
							))}
						</div>
					) : (
						<div className="flex min-h-[140px] items-center justify-center rounded-2xl border border-dashed border-sidebar-border/80 bg-sidebar-accent/10 px-6 text-center text-sm leading-6 text-neutral-500">
							Drop vowels here.
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}

export default function HebrewVowelsSorting() {
	const [mode, setMode] = useState<VowelMode>('length')
	const [deck, setDeck] = useState(() => shuffle(HEBREW_VOWEL_BANK_ITEMS))
	const [placements, setPlacements] = useState<Record<string, SortBucket>>({})
	const [activeId, setActiveId] = useState<string | null>(null)

	useEffect(() => {
		setPlacements({})
		setActiveId(null)
	}, [mode])

	const sensors = useSensors(
		useSensor(MouseSensor, {
			activationConstraint: { distance: 6 },
		}),
		useSensor(TouchSensor, {
			activationConstraint: { delay: 120, tolerance: 8 },
		})
	)

	const unsortedItems = useMemo(
		() => deck.filter((item) => !placements[item.id]),
		[deck, placements]
	)

	const buckets = BUCKETS_BY_MODE[mode]

	const bucketItems = useMemo(
		() =>
			Object.fromEntries(
				buckets.map((bucket) => [
					bucket.id,
					sortItems(deck.filter((item) => placements[item.id] === bucket.id)),
				])
			) as Partial<Record<SortBucket, HebrewVowelBankItem[]>>,
		[buckets, deck, placements]
	)

	const sortedCount = deck.length - unsortedItems.length
	const correctCount = deck.filter(
		(item) => placements[item.id] === getCorrectBucket(item, mode)
	).length
	const isComplete = sortedCount === deck.length

	function resetRound() {
		setPlacements({})
		setActiveId(null)
	}

	function shuffleRound() {
		setDeck(shuffle(HEBREW_VOWEL_BANK_ITEMS))
		setPlacements({})
		setActiveId(null)
	}

	function handleDragEnd(event: DragEndEvent) {
		setActiveId(null)

		const { active, over } = event
		if (!over) return

		const item = deck.find((entry) => entry.id === String(active.id))
		const bucketId = buckets.find((bucket) => bucket.id === over.id)?.id ?? null

		if (!item || !bucketId) return
		if (getCorrectBucket(item, mode) !== bucketId) return

		setPlacements((current) => ({
			...current,
			[item.id]: bucketId,
		}))
	}

	const activeItem = activeId
		? deck.find((item) => item.id === activeId) ?? null
		: null

	return (
		<div className="w-full max-w-6xl space-y-6">
			<Card className="border-sidebar-border bg-white/85 shadow-sm">
				<CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
					<div className="grid gap-4 sm:grid-cols-3">
						<div>
							<p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500">
								Mode
							</p>
							<p className="mt-1 text-3xl font-extrabold tracking-tight text-neutral-800">
								{mode === 'length' ? 'Length' : 'Class'}
							</p>
						</div>
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
								Status
							</p>
							<p className="mt-1 text-lg font-bold text-neutral-700">
								{isComplete ? 'All sorted' : `Correct ${correctCount}`}
							</p>
						</div>
					</div>

					<div className="flex flex-wrap gap-3">
						<Button type="button" variant="secondary" className="gap-2" onClick={resetRound}>
							<RotateCcw className="h-4 w-4" />
							Reset
						</Button>
						<Button type="button" variant="secondary" className="gap-2" onClick={shuffleRound}>
							<Shuffle className="h-4 w-4" />
							New Mix
						</Button>
					</div>
				</CardContent>
			</Card>

			<Card className="border-sidebar-border bg-white/85 shadow-sm">
				<CardHeader className="pb-4">
					<CardTitle className="text-2xl text-neutral-800">
						Choose A Sort
					</CardTitle>
					<p className="text-sm leading-6 text-neutral-600">
						Start by choosing whether to sort by vowel length or by vowel class.
						The bank comes from the same niqqud list used in Letter Quiz and the
						construct conversion activity.
					</p>
				</CardHeader>
				<CardContent className="flex flex-wrap gap-3">
					{MODE_OPTIONS.map((option) => (
						<Button
							key={option.id}
							type="button"
							variant={mode === option.id ? 'primary' : 'secondary'}
							onClick={() => setMode(option.id)}
						>
							{option.label}
						</Button>
					))}
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
								Vowel Bank
							</CardTitle>
							<p className="text-sm leading-6 text-neutral-600">
								Drag each niqqud into the correct group. A tile only locks in
								when it lands in the right bucket.
							</p>
						</CardHeader>
						<CardContent>
							{unsortedItems.length ? (
								<div className="flex flex-wrap gap-3">
									{sortItems(unsortedItems).map((item) => (
										<VowelChip key={item.id} item={item} />
									))}
								</div>
							) : (
								<div className="flex min-h-[160px] flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/80 px-6 text-center">
									<Check className="h-10 w-10 text-emerald-600" />
									<p className="mt-4 text-lg font-bold text-emerald-800">
										Everything is sorted.
									</p>
									<p className="mt-2 max-w-sm text-sm leading-6 text-emerald-700">
										Switch modes, reset, or shuffle for another pass through the
										vowel bank.
									</p>
								</div>
							)}
						</CardContent>
					</Card>

					<div
						className={cn(
							'grid gap-6',
							mode === 'length' ? 'md:grid-cols-2' : 'lg:grid-cols-3'
						)}
					>
						{buckets.map((bucket) => (
							<DropZone
								key={bucket.id}
								bucket={bucket}
								items={bucketItems[bucket.id] ?? []}
							/>
						))}
					</div>
				</div>

				<DragOverlay>
					{activeItem ? (
						<div className="w-[180px] max-w-[80vw]">
							<VowelChip item={activeItem} disabled />
						</div>
					) : null}
				</DragOverlay>
			</DndContext>
		</div>
	)
}
