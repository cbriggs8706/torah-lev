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
import { ArrowLeftRight, Check, RotateCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
	formatHebrewBankPieceDisplay,
	type HebrewVowelBankItem,
} from '@/lib/data/hebrew/hebrew-vowel-bank'
import {
	getHistoricVowelShiftItems,
	getHistoricVowelShiftTargets,
	HISTORIC_VOWEL_SHIFT_ROWS,
	type HistoricVowelShiftMode,
	type HistoricVowelShiftRow,
} from '@/lib/data/hebrew/hebrew-historic-vowel-shifts'
import { cn } from '@/lib/utils'

type SlotDefinition = {
	id: string
	rowId: HistoricVowelShiftRow['id']
	allowedKeys: string[]
}

const MODE_OPTIONS: { id: HistoricVowelShiftMode; label: string }[] = [
	{ id: 'reduce', label: 'Reduce' },
	{ id: 'lengthen', label: 'Lengthen' },
]

const nameCollator = new Intl.Collator('en', {
	numeric: true,
	sensitivity: 'base',
})

function sortItems(items: HebrewVowelBankItem[]) {
	return [...items].sort(
		(a, b) => nameCollator.compare(a.name, b.name) || a.id.localeCompare(b.id)
	)
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
			id: item.key,
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
				disabled && 'cursor-default opacity-70'
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

function StaticVowelChip({ item }: { item: HebrewVowelBankItem }) {
	return (
		<div className="flex min-w-[88px] flex-col items-center rounded-2xl border border-sidebar-border/80 bg-sidebar-accent/10 px-3 py-3 text-center">
			<p dir="rtl" className="font-cardo text-3xl leading-none text-neutral-800">
				{formatHebrewBankPieceDisplay(item.text)}
			</p>
			<p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
				{item.name}
			</p>
		</div>
	)
}

function Slot({
	slotId,
	item,
	onClear,
	enabled,
}: {
	slotId: string
	item: HebrewVowelBankItem | null
	onClear: () => void
	enabled: boolean
}) {
	const { isOver, setNodeRef } = useDroppable({
		id: slotId,
		disabled: !enabled,
	})

	return (
		<button
			ref={setNodeRef}
			type="button"
			onClick={item ? onClear : undefined}
			className={cn(
				'flex min-h-[108px] min-w-[96px] items-center justify-center rounded-2xl border-2 border-dashed px-3 py-3 text-center transition',
				enabled
					? 'border-sidebar-primary/30 bg-white/90'
					: 'border-sidebar-border/70 bg-neutral-50/80',
				isOver && enabled && 'border-sidebar-primary bg-sidebar-accent/20 shadow-sm',
				item && 'border-emerald-300 bg-emerald-50/80',
				item && enabled && 'hover:border-emerald-400 hover:bg-emerald-100/70'
			)}
		>
			{item ? (
				<div className="pointer-events-none">
					<StaticVowelChip item={item} />
				</div>
			) : (
				<p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
					{enabled ? 'Drop Here' : 'Reference'}
				</p>
			)}
		</button>
	)
}

export default function HebrewHistoricVowelShifts() {
	const [mode, setMode] = useState<HistoricVowelShiftMode>('reduce')
	const [placements, setPlacements] = useState<Record<string, string>>({})
	const [activeKey, setActiveKey] = useState<string | null>(null)

	useEffect(() => {
		setPlacements({})
		setActiveKey(null)
	}, [mode])

	const sensors = useSensors(
		useSensor(MouseSensor, {
			activationConstraint: { distance: 6 },
		}),
		useSensor(TouchSensor, {
			activationConstraint: { delay: 120, tolerance: 8 },
		})
	)

	const bankItems = useMemo(
		() => sortItems(getHistoricVowelShiftTargets(mode)),
		[mode]
	)

	const slots = useMemo<SlotDefinition[]>(
		() =>
			HISTORIC_VOWEL_SHIFT_ROWS.flatMap((row) => {
				const targetKeys = mode === 'reduce' ? row.reducedKeys : row.lengthenedKeys
				return targetKeys.map((_, index) => ({
					id: `${mode}-${row.id}-${index}`,
					rowId: row.id,
					allowedKeys: targetKeys,
				}))
			}),
		[mode]
	)

	const slotMap = useMemo(
		() => new Map(slots.map((slot) => [slot.id, slot] as const)),
		[slots]
	)

	const filledCount = Object.keys(placements).length
	const totalSlots = slots.length
	const activeItem =
		activeKey ? bankItems.find((item) => item.key === activeKey) ?? null : null

	function resetRound() {
		setPlacements({})
		setActiveKey(null)
	}

	function clearSlot(slotId: string) {
		setPlacements((current) => {
			const next = { ...current }
			delete next[slotId]
			return next
		})
	}

	function getAssignedItem(slotId: string) {
		const assignedKey = placements[slotId]
		if (!assignedKey) return null
		return getHistoricVowelShiftItems([assignedKey])[0] ?? null
	}

	function getRowPlacements(rowId: HistoricVowelShiftRow['id']) {
		return Object.entries(placements)
			.filter(([slotId]) => slotMap.get(slotId)?.rowId === rowId)
			.map(([, assignedKey]) => assignedKey)
	}

	function handleDragEnd(event: DragEndEvent) {
		setActiveKey(null)

		const { active, over } = event
		if (!over) return

		const slot = slotMap.get(String(over.id))
		const draggedKey = String(active.id)

		if (!slot) return
		if (!slot.allowedKeys.includes(draggedKey)) return

		const rowKeys = getRowPlacements(slot.rowId)
		const keyAlreadyUsedInRow =
			rowKeys.includes(draggedKey) && placements[slot.id] !== draggedKey

		if (keyAlreadyUsedInRow) return

		setPlacements((current) => ({
			...current,
			[slot.id]: draggedKey,
		}))
	}

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
								{mode === 'reduce' ? 'Reduce' : 'Lengthen'}
							</p>
						</div>
						<div>
							<p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500">
								Progress
							</p>
							<p className="mt-1 text-3xl font-extrabold tracking-tight text-neutral-800">
								{filledCount}/{totalSlots}
							</p>
						</div>
						<div>
							<p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500">
								Goal
							</p>
							<p className="mt-1 text-lg font-bold text-neutral-700">
								Move each historic short vowel the right direction.
							</p>
						</div>
					</div>

					<div className="flex flex-wrap gap-3">
						<Button
							type="button"
							variant="secondary"
							className="gap-2"
							onClick={resetRound}
						>
							<RotateCcw className="h-4 w-4" />
							Clear Chart
						</Button>
					</div>
				</CardContent>
			</Card>

			<Card className="border-sidebar-border bg-white/85 shadow-sm">
				<CardHeader className="pb-4">
					<CardTitle className="text-2xl text-neutral-800">
						Choose A Direction
					</CardTitle>
					<p className="text-sm leading-6 text-neutral-600">
						Use the chart to practice two moves from the historic short vowels:
						reduce them to a quick vowel or lengthen them to the fuller form.
						The final column stays visible as a reference for the historic long
						side of the pattern.
					</p>
				</CardHeader>
				<CardContent className="flex flex-wrap gap-3">
					{MODE_OPTIONS.map((option) => (
						<Button
							key={option.id}
							type="button"
							variant={mode === option.id ? 'primary' : 'secondary'}
							onClick={() => setMode(option.id)}
							className="gap-2"
						>
							<ArrowLeftRight className="h-4 w-4" />
							{option.label}
						</Button>
					))}
				</CardContent>
			</Card>

			<DndContext
				sensors={sensors}
				onDragStart={({ active }) => setActiveKey(String(active.id))}
				onDragEnd={handleDragEnd}
				onDragCancel={() => setActiveKey(null)}
			>
				<Card className="border-sidebar-border bg-white/85 shadow-sm">
					<CardHeader className="pb-4">
						<CardTitle className="text-2xl text-neutral-800">
							Answer Bank
						</CardTitle>
						<p className="text-sm leading-6 text-neutral-600">
							Drag from the bank into the highlighted column for the current
							mode. Tiles stay in the bank so you can reuse a reduced vowel such
							as shva in more than one row.
						</p>
					</CardHeader>
					<CardContent>
						<div className="flex flex-wrap gap-3">
							{bankItems.map((item) => (
								<VowelChip key={item.key} item={item} />
							))}
						</div>
					</CardContent>
				</Card>

				<div className="space-y-5">
					{HISTORIC_VOWEL_SHIFT_ROWS.map((row) => {
						const reducedItems = getHistoricVowelShiftItems(row.reducedKeys)
						const historicShortItems = getHistoricVowelShiftItems(row.historicShortKeys)
						const lengthenedItems = getHistoricVowelShiftItems(row.lengthenedKeys)
						const historicLongItems = getHistoricVowelShiftItems(row.historicLongKeys)
						const activeSlots = slots.filter((slot) => slot.rowId === row.id)

						return (
							<Card
								key={row.id}
								className="border-sidebar-border bg-white/85 shadow-sm"
							>
								<CardHeader className="pb-4">
									<div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
										<div>
											<CardTitle className="text-2xl text-neutral-800">
												{row.label}
											</CardTitle>
											<p className="mt-1 text-sm font-semibold uppercase tracking-[0.16em] text-neutral-500">
												Proto-Semitic {row.protoSemitic}
											</p>
										</div>
										{row.note ? (
											<p className="max-w-xl text-sm leading-6 text-neutral-600">
												{row.note}
											</p>
										) : null}
									</div>
								</CardHeader>
								<CardContent className="space-y-5">
									<div className="grid gap-4 xl:grid-cols-4">
										<div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-4">
											<p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-700">
												Reduced
											</p>
											<div className="mt-4 flex flex-wrap gap-3">
												{reducedItems.map((item, index) => {
													const slot =
														mode === 'reduce' ? activeSlots[index] : undefined
													const assignedItem = slot
														? getAssignedItem(slot.id)
														: item
													return (
														<Slot
															key={slot?.id ?? `${row.id}-reduced-${item.key}`}
															slotId={slot?.id ?? `${row.id}-reduced-reference-${item.key}`}
															item={assignedItem}
															onClear={() => (slot ? clearSlot(slot.id) : undefined)}
															enabled={mode === 'reduce' && Boolean(slot)}
														/>
													)
												})}
											</div>
										</div>

										<div className="rounded-3xl border border-neutral-200 bg-neutral-50/80 p-4">
											<p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-600">
												Historic Short
											</p>
											<div className="mt-4 flex flex-wrap gap-3">
												{historicShortItems.map((item) => (
													<StaticVowelChip key={`${row.id}-${item.key}`} item={item} />
												))}
											</div>
										</div>

										<div className="rounded-3xl border border-sky-200 bg-sky-50/80 p-4">
											<p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-700">
												Lengthened
											</p>
											<div className="mt-4 flex flex-wrap gap-3">
												{lengthenedItems.map((item, index) => {
													const slot =
														mode === 'lengthen' ? activeSlots[index] : undefined
													const assignedItem = slot
														? getAssignedItem(slot.id)
														: item
													return (
														<Slot
															key={slot?.id ?? `${row.id}-lengthened-${item.key}`}
															slotId={slot?.id ?? `${row.id}-lengthened-reference-${item.key}`}
															item={assignedItem}
															onClear={() => (slot ? clearSlot(slot.id) : undefined)}
															enabled={mode === 'lengthen' && Boolean(slot)}
														/>
													)
												})}
											</div>
										</div>

										<div className="rounded-3xl border border-emerald-200 bg-emerald-50/80 p-4">
											<div className="flex items-center justify-between gap-3">
												<p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700">
													Historic Long
												</p>
												{row.id === 'a-class' ? (
													<span className="text-xs font-semibold text-emerald-700">
														Rare
													</span>
												) : null}
											</div>
											<div className="mt-4 flex flex-wrap gap-3">
												{historicLongItems.map((item) => (
													<StaticVowelChip
														key={`${row.id}-historic-long-${item.key}`}
														item={item}
													/>
												))}
											</div>
										</div>
									</div>

									{mode === 'reduce' ? (
										<p className="text-sm leading-6 text-neutral-600">
											In this mode, fill the reduced side for each row. Click a
											filled slot to clear it.
										</p>
									) : (
										<p className="text-sm leading-6 text-neutral-600">
											In this mode, fill the lengthened side for each row. The
											historic long column stays visible as a reminder of what
											can develop from the long forms.
										</p>
									)}
								</CardContent>
							</Card>
						)
					})}
				</div>

				<DragOverlay>
					{activeItem ? (
						<div className="w-[180px] max-w-[80vw]">
							<VowelChip item={activeItem} disabled />
						</div>
					) : null}
				</DragOverlay>
			</DndContext>

			{filledCount === totalSlots ? (
				<Card className="border-emerald-300 bg-emerald-50/80 shadow-sm">
					<CardContent className="flex flex-col items-center justify-center gap-3 p-6 text-center">
						<Check className="h-10 w-10 text-emerald-600" />
						<p className="text-xl font-bold text-emerald-800">
							Chart complete.
						</p>
						<p className="max-w-2xl text-sm leading-6 text-emerald-700">
							Switch directions and run the chart again so you practice both
							reduction and lengthening from the same historic short vowels.
						</p>
					</CardContent>
				</Card>
			) : null}
		</div>
	)
}
