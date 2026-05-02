'use client'

import { useEffect, useRef, useState } from 'react'
import {
	DragOverlay,
	DndContext,
	type DragEndEvent,
	type DragOverEvent,
	type DragStartEvent,
	PointerSensor,
	pointerWithin,
	useDraggable,
	useDroppable,
	useSensor,
	useSensors,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { CheckCircle2, RefreshCcw, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
	tanakhSections,
	type TanakhBook,
	type TanakhSection,
} from '@/lib/data/hebrew/tanakh-books'

type StudyMode = 'study' | 'game'

type BookWithLocation = TanakhBook & {
	sectionId: string
	subgroupId: string
}

type GroupTarget = {
	id: string
	sectionId: string
	subgroupHebrew: string
	books: BookWithLocation[]
}

type GameSlot = string | null

type GameState = {
	bank: string[]
} & Record<string, GameSlot[] | string[]>

type BookLocation = {
	containerId: string
	slotIndex: number | null
}

const BANK_ID = 'bank'

const groupTargets: GroupTarget[] = tanakhSections.flatMap((section) =>
	section.subgroups.map((subgroup) => ({
		id: subgroup.id,
		sectionId: section.id,
		subgroupHebrew: subgroup.title,
		books: subgroup.books.map((book) => ({
			...book,
			sectionId: section.id,
			subgroupId: subgroup.id,
		})),
	})),
)

const bookLookup = Object.fromEntries(
	groupTargets.flatMap((group) => group.books.map((book) => [book.slug, book])),
) as Record<string, BookWithLocation>

const orderedGroupIds = groupTargets.map((group) => group.id)
const allBookSlugs = groupTargets.flatMap((group) =>
	group.books.map((book) => book.slug),
)
const bookNumberLookup = Object.fromEntries(
	allBookSlugs.map((slug, index) => [slug, index + 1]),
) as Record<string, number>

function getSlotId(groupId: string, slotIndex: number) {
	return `slot:${groupId}:${slotIndex}`
}

function parseSlotId(id: string) {
	if (!id.startsWith('slot:')) return null

	const [, groupId, slotIndex] = id.split(':')
	const parsedIndex = Number(slotIndex)
	if (!groupId || Number.isNaN(parsedIndex)) return null

	return {
		containerId: groupId,
		index: parsedIndex,
	}
}

function getSectionHeadingClassName(sectionId: string) {
	if (sectionId === 'torah') return 'text-sky-900'
	if (sectionId === 'neviim') return 'text-emerald-900'
	return 'text-amber-900'
}

function getSubheadingClassName(sectionId: string) {
	if (sectionId === 'torah') {
		return 'rounded-2xl bg-sky-900 px-4 py-3 text-white shadow-sm'
	}

	if (sectionId === 'neviim') {
		return 'rounded-2xl bg-emerald-900 px-4 py-3 text-white shadow-sm'
	}

	return 'rounded-2xl bg-amber-900 px-4 py-3 text-white shadow-sm'
}

function shuffleItems(items: string[]) {
	const next = [...items]

	for (let index = next.length - 1; index > 0; index -= 1) {
		const randomIndex = Math.floor(Math.random() * (index + 1))
		;[next[index], next[randomIndex]] = [next[randomIndex], next[index]]
	}

	return next
}

function createInitialGameState(): GameState {
	const emptyGroups = Object.fromEntries(
		orderedGroupIds.map((groupId) => [
			groupId,
			groupTargets
				.find((group) => group.id === groupId)
				?.books.map(() => null) ?? [],
		]),
	) as Record<string, GameSlot[]>

	return {
		bank: shuffleItems(allBookSlugs),
		...emptyGroups,
	}
}

function findBookLocation(slug: string, state: GameState): BookLocation | null {
	if ((state.bank as string[]).includes(slug)) {
		return { containerId: BANK_ID, slotIndex: null }
	}

	for (const groupId of orderedGroupIds) {
		const slots = state[groupId] as GameSlot[]
		const slotIndex = slots.indexOf(slug)

		if (slotIndex !== -1) {
			return { containerId: groupId, slotIndex }
		}
	}

	return null
}

function ToggleAudioHeading({
	hebrew,
	english,
	audioSrc,
	isEnglish,
	onToggle,
	onPlay,
	isPlaying,
	size = 'section',
}: {
	hebrew: string
	english: string
	audioSrc?: string
	isEnglish: boolean
	onToggle: () => void
	onPlay: () => void
	isPlaying: boolean
	size?: 'section' | 'subgroup'
}) {
	const textClassName =
		size === 'section'
			? isEnglish
				? 'text-4xl font-extrabold tracking-[0.08em] sm:text-5xl'
				: 'font-cardo text-5xl sm:text-6xl'
			: isEnglish
				? 'text-sm font-extrabold tracking-[0.01em] sm:text-[0.95rem]'
				: 'font-cardo text-[1.15rem] sm:text-[1.25rem]'

	return (
		<div
			className={cn(
				'mx-auto flex w-[92%] items-center justify-center gap-3',
				size === 'section' ? 'mb-6' : 'mb-4',
			)}
		>
			<Button
				type="button"
				variant="ghost"
				size="icon"
				onClick={onPlay}
				aria-label={`Play pronunciation for ${english}`}
				className={cn(
					'h-7 w-7 shrink-0 rounded-full border border-sky-200 bg-sky-50 p-0 text-sky-600 hover:bg-sky-100',
					isPlaying && 'border-sky-300 bg-sky-100 text-sky-700',
				)}
			>
				<Volume2 className="h-3.5 w-3.5" />
			</Button>

			<button
				type="button"
				onClick={onToggle}
				aria-pressed={isEnglish}
				className="min-w-0 flex-1"
			>
				<span
					dir={isEnglish ? 'ltr' : 'rtl'}
					className={cn(
						'block max-w-full whitespace-nowrap text-center leading-none',
						textClassName,
					)}
				>
					{isEnglish ? english : hebrew}
				</span>
			</button>
		</div>
	)
}

function BookPill({
	book,
	isEnglish,
	isPlaying,
	onToggle,
	onPlay,
}: {
	book: TanakhBook
	isEnglish: boolean
	isPlaying: boolean
	onToggle: () => void
	onPlay: () => void
}) {
	return (
		<div className="mx-auto flex w-[96%] items-center justify-between gap-2 rounded-2xl border border-white/80 bg-white/85 px-3 py-2.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
			<Button
				type="button"
				variant="ghost"
				size="icon"
				onClick={onPlay}
				aria-label={`Play pronunciation for ${book.english}`}
				className={cn(
					'h-7 w-7 shrink-0 rounded-full border border-sky-200 bg-sky-50 p-0 text-sky-600 hover:bg-sky-100',
					isPlaying && 'border-sky-300 bg-sky-100 text-sky-700',
				)}
			>
				<Volume2 className="h-3.5 w-3.5" />
			</Button>

			<button
				type="button"
				onClick={onToggle}
				className="min-w-0 flex-1 text-right"
				aria-pressed={isEnglish}
			>
				<span
					dir={isEnglish ? 'ltr' : 'rtl'}
					className={cn(
						'block whitespace-nowrap leading-none text-neutral-900 transition',
						isEnglish
							? 'font-bold text-sm tracking-normal sm:text-[0.95rem]'
							: 'font-cardo text-[1.35rem] sm:text-[1.5rem]',
					)}
				>
					{isEnglish ? book.english : book.hebrew}
				</span>
			</button>
		</div>
	)
}

function SectionCard({
	section,
	visibleBooks,
	visibleHeadings,
	playingSlug,
	onToggleBook,
	onToggleHeading,
	onPlayAudio,
}: {
	section: TanakhSection
	visibleBooks: Set<string>
	visibleHeadings: Set<string>
	playingSlug: string | null
	onToggleBook: (slug: string) => void
	onToggleHeading: (slug: string) => void
	onPlayAudio: (slug: string, english: string, audioSrc?: string) => void
}) {
	const renderSubgroup = (subgroupId: string) => {
		const subgroup = section.subgroups.find((item) => item.id === subgroupId)
		if (!subgroup) return null

		return (
			<div key={subgroup.id}>
				{subgroup.title ? (
					<div className={cn('mb-3', getSubheadingClassName(section.id))}>
						<ToggleAudioHeading
							hebrew={subgroup.title}
							english={subgroup.englishTitle}
							audioSrc={subgroup.audioSrc}
							isEnglish={visibleHeadings.has(subgroup.id)}
							onToggle={() => onToggleHeading(subgroup.id)}
							onPlay={() =>
								onPlayAudio(
									subgroup.id,
									subgroup.englishTitle,
									subgroup.audioSrc,
								)
							}
							isPlaying={playingSlug === subgroup.id}
							size="subgroup"
						/>
					</div>
				) : null}

				{subgroup.id === 'shnei-asar' ? (
					<div className="grid grid-cols-2 gap-3">
						<div className="grid justify-items-center gap-3">
							{subgroup.books.slice(0, 6).map((book) => (
								<BookPill
									key={book.slug}
									book={book}
									isEnglish={visibleBooks.has(book.slug)}
									isPlaying={playingSlug === book.slug}
									onToggle={() => onToggleBook(book.slug)}
									onPlay={() =>
										onPlayAudio(book.slug, book.english, book.audioSrc)
									}
								/>
							))}
						</div>
						<div className="grid justify-items-center gap-3">
							{subgroup.books.slice(6).map((book) => (
								<BookPill
									key={book.slug}
									book={book}
									isEnglish={visibleBooks.has(book.slug)}
									isPlaying={playingSlug === book.slug}
									onToggle={() => onToggleBook(book.slug)}
									onPlay={() =>
										onPlayAudio(book.slug, book.english, book.audioSrc)
									}
								/>
							))}
						</div>
					</div>
				) : (
					<div className="grid justify-items-center gap-3">
						{subgroup.books.map((book) => (
							<BookPill
								key={book.slug}
								book={book}
								isEnglish={visibleBooks.has(book.slug)}
								isPlaying={playingSlug === book.slug}
								onToggle={() => onToggleBook(book.slug)}
								onPlay={() =>
									onPlayAudio(book.slug, book.english, book.audioSrc)
								}
							/>
						))}
					</div>
				)}
			</div>
		)
	}

	return (
		<div dir="rtl">
			<div className={cn('mb-4', getSectionHeadingClassName(section.id))}>
				<ToggleAudioHeading
					hebrew={section.title}
					english={section.englishTitle}
					audioSrc={section.audioSrc}
					isEnglish={visibleHeadings.has(section.id)}
					onToggle={() => onToggleHeading(section.id)}
					onPlay={() =>
						onPlayAudio(section.id, section.englishTitle, section.audioSrc)
					}
					isPlaying={playingSlug === section.id}
					size="section"
				/>
			</div>

			<section
				className={cn(
					'rounded-[2rem] border p-6 shadow-sm sm:p-8',
					section.tintClassName,
				)}
			>
				{section.id === 'neviim' ? (
					<div className="space-y-3">
						<div className="grid gap-3 md:grid-cols-2">
							<div className="space-y-3">{renderSubgroup('rishonim')}</div>
							<div className="space-y-3">{renderSubgroup('acharonim')}</div>
						</div>
						{renderSubgroup('shnei-asar')}
					</div>
				) : (
					<div className="space-y-8">
						{section.subgroups.map((subgroup) => renderSubgroup(subgroup.id))}
					</div>
				)}
			</section>
		</div>
	)
}

function DraggableBookChip({
	id,
	book,
	isCorrect,
	onReturnToBank,
	isOverlay = false,
}: {
	id: string
	book: BookWithLocation
	isCorrect?: boolean
	onReturnToBank?: (slug: string) => void
	isOverlay?: boolean
}) {
	const { attributes, listeners, setNodeRef, transform, isDragging } =
		useDraggable({
			id,
			disabled: isOverlay,
		})

	const style = {
		transform: isOverlay ? undefined : CSS.Translate.toString(transform),
		opacity: isOverlay ? 1 : isDragging ? 0 : 1,
	}

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			dir="rtl"
			onDoubleClick={() => onReturnToBank?.(id)}
			className={cn(
				'flex cursor-grab items-center justify-between gap-1.5 rounded-xl border px-2.5 py-1.5 text-right shadow-sm active:cursor-grabbing',
				isOverlay && 'cursor-grabbing shadow-lg ring-2 ring-sky-300',
				isCorrect
					? 'border-emerald-300 bg-emerald-50 text-emerald-900'
					: 'border-sky-200 bg-white text-neutral-900',
			)}
		>
			<span
				dir="rtl"
				className="flex-1 font-cardo text-[2rem] leading-none text-right"
			>
				{book.hebrew}
			</span>
		</div>
	)
}

function DroppableBookArea({
	id,
	items,
	isOver,
	children,
	placeholder,
	className,
}: {
	id: string
	items: string[]
	isOver: boolean
	children: React.ReactNode
	placeholder: string
	className?: string
}) {
	const { setNodeRef } = useDroppable({
		id,
		data: { type: 'container', containerId: id },
	})

	return (
		<div
			ref={setNodeRef}
			className={cn(
				'min-h-[72px] rounded-2xl border-2 border-dashed p-2.5 transition',
				isOver ? 'border-sky-500 bg-sky-50' : 'border-slate-200 bg-white/80',
				className,
			)}
		>
			{items.length === 0 ? (
				<div className="flex min-h-[48px] items-center justify-center text-center text-sm font-semibold text-slate-400">
					{placeholder}
				</div>
			) : (
				<div className="flex flex-wrap gap-1.5" dir="rtl">
					{children}
				</div>
			)}
		</div>
	)
}

function NumberedTargetSlot({
	number,
	itemSlug,
	groupId,
	slotIndex,
	isCorrect,
	onReturnToBank,
}: {
	number: number
	itemSlug: GameSlot
	groupId: string
	slotIndex: number
	isCorrect: boolean
	onReturnToBank: (slug: string) => void
}) {
	const { setNodeRef, isOver } = useDroppable({
		id: getSlotId(groupId, slotIndex),
		data: {
			type: 'slot',
			containerId: groupId,
			index: slotIndex,
		},
	})

	return (
		<div
			ref={setNodeRef}
			className={cn(
				'flex min-h-[56px] items-center gap-2 rounded-xl border px-2 py-1.5 transition',
				isOver && 'border-sky-500 bg-sky-50',
				isCorrect
					? 'border-emerald-300 bg-emerald-100/80'
					: itemSlug
						? 'border-slate-200 bg-white/90'
						: 'border-dashed border-slate-200 bg-white/60',
			)}
		>
			<div
				className={cn(
					'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold',
					isCorrect
						? 'bg-emerald-700 text-white'
						: 'bg-slate-200 text-slate-700',
				)}
			>
				{number}
			</div>
			<div className="min-w-0 flex-1">
				{itemSlug ? (
					<DraggableBookChip
						id={itemSlug}
						book={bookLookup[itemSlug]}
						isCorrect={isCorrect}
						onReturnToBank={onReturnToBank}
					/>
				) : (
					<div className="h-[40px]" />
				)}
			</div>
		</div>
	)
}

function NumberedGroupArea({
	group,
	items,
	onReturnToBank,
}: {
	group: GroupTarget
	items: GameSlot[]
	onReturnToBank: (slug: string) => void
}) {
	const renderSlot = (slotIndex: number) => {
		const expectedBook = group.books[slotIndex]
		const itemSlug = items[slotIndex]
		const isCorrect = itemSlug === expectedBook?.slug

		return (
			<NumberedTargetSlot
				key={`${group.id}-${slotIndex}`}
				number={bookNumberLookup[expectedBook.slug]}
				itemSlug={itemSlug}
				groupId={group.id}
				slotIndex={slotIndex}
				isCorrect={isCorrect}
				onReturnToBank={onReturnToBank}
			/>
		)
	}

	return (
		<div className="rounded-2xl p-1 transition">
			{group.id === 'shnei-asar' ? (
				<div className="flex flex-row-reverse gap-2">
					<div className="flex-1 space-y-2">
						{group.books.slice(6).map((_, index) => renderSlot(index + 6))}
					</div>
					<div className="flex-1 space-y-2">
						{group.books.slice(0, 6).map((_, index) => renderSlot(index))}
					</div>
				</div>
			) : (
				<div className="space-y-2">
					{group.books.map((_, index) => renderSlot(index))}
				</div>
			)}
		</div>
	)
}

function TanakhGame({
	gameState,
	draggingId,
	hoveredContainerId,
	showResults,
	onCheck,
	onReset,
	onReturnToBank,
	isComplete,
}: {
	gameState: GameState
	draggingId: string | null
	hoveredContainerId: string | null
	showResults: boolean
	onCheck: () => void
	onReset: () => void
	onReturnToBank: (slug: string) => void
	isComplete: boolean
}) {
	const booksRemaining = (gameState.bank as string[]).length

	const renderGroup = (group: GroupTarget) => {
		const items = gameState[group.id] as GameSlot[]
		const isCorrect = items.every(
			(slug, index) => slug === group.books[index]?.slug,
		)

		return (
			<div key={group.id}>
				{group.subgroupHebrew ? (
					<h3
						className={cn(
							'mb-2 text-center font-cardo text-2xl sm:text-3xl',
							getSubheadingClassName(group.sectionId),
						)}
					>
						{group.subgroupHebrew}
					</h3>
				) : null}

				<div
					className={cn(
						showResults &&
							(isCorrect
								? 'rounded-2xl ring-2 ring-emerald-300'
								: 'rounded-2xl ring-2 ring-rose-200'),
					)}
				>
					<NumberedGroupArea
						group={group}
						items={items}
						onReturnToBank={onReturnToBank}
					/>
				</div>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<div className="rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-sm">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">
							Randomizer Game
						</p>
						<p className="mt-2 text-neutral-700">
							Drag each book into the correct category and numbered target. Each
							slot is independent, so you do not need to place them in order.
						</p>
					</div>

					<div className="flex flex-wrap gap-3">
						<Button variant="secondary" onClick={onCheck}>
							Check Order
						</Button>
						<Button variant="primaryOutline" onClick={onReset}>
							<RefreshCcw className="mr-2 h-4 w-4" />
							Randomize Again
						</Button>
					</div>
				</div>

				<div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
					<div className="rounded-full bg-sky-100 px-4 py-2 text-sky-700">
						Books left to place: {booksRemaining}
					</div>
					{showResults ? (
						<div
							className={cn(
								'rounded-full px-4 py-2',
								isComplete
									? 'bg-emerald-100 text-emerald-700'
									: 'bg-rose-100 text-rose-700',
							)}
						>
							{isComplete
								? 'Perfect. Everything is in the right place.'
								: 'Not quite yet. Keep adjusting the slots.'}
						</div>
					) : null}
				</div>
			</div>

			<div className="rounded-[2rem] border border-slate-200 bg-slate-50/80 p-4 shadow-sm">
				<h3 className="mb-3 text-lg font-bold text-slate-700">Book Bank</h3>
				<DroppableBookArea
					id={BANK_ID}
					items={gameState.bank as string[]}
					isOver={hoveredContainerId === BANK_ID}
					placeholder="Start here, then drag each book into its proper place."
				>
					{(gameState.bank as string[]).map((slug) => (
						<DraggableBookChip
							key={slug}
							id={slug}
							book={bookLookup[slug]}
							onReturnToBank={onReturnToBank}
						/>
					))}
				</DroppableBookArea>
				<p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
					{draggingId
						? `Dragging: ${bookLookup[draggingId]?.english ?? ''}`
						: 'Double-click a placed book to send it back to the bank'}
				</p>
			</div>

			<div
				dir="rtl"
				className="space-y-4 xl:flex xl:items-start xl:gap-4 xl:space-y-0"
			>
				{tanakhSections.map((section) => (
					<section
						key={section.id}
						className={cn(
							'rounded-[2rem] border p-4 shadow-sm sm:p-5',
							section.id === 'neviim' ? 'xl:w-1/2' : 'xl:w-1/4',
							section.tintClassName,
						)}
					>
						<h2
							className={cn(
								'mb-4 text-center font-cardo text-4xl sm:text-5xl',
								getSectionHeadingClassName(section.id),
							)}
						>
							{section.title}
						</h2>

						{section.id === 'neviim' ? (
							<div className="space-y-3">
								<div className="grid gap-3 md:grid-cols-2">
									<div className="space-y-3">
										{renderGroup(
											groupTargets.find((group) => group.id === 'rishonim')!,
										)}
									</div>
									<div className="space-y-3">
										{renderGroup(
											groupTargets.find((group) => group.id === 'acharonim')!,
										)}
									</div>
								</div>
								{renderGroup(
									groupTargets.find((group) => group.id === 'shnei-asar')!,
								)}
							</div>
						) : (
							<div className="space-y-3">
								{groupTargets
									.filter((group) => group.sectionId === section.id)
									.map((group) => renderGroup(group))}
							</div>
						)}
					</section>
				))}
			</div>

			{isComplete ? (
				<div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 text-center shadow-sm">
					<CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
					<h3 className="mt-3 text-2xl font-bold text-emerald-700">
						Excellent work
					</h3>
					<p className="mt-2 text-emerald-800">
						Every book is in the correct TaNaK category and order.
					</p>
				</div>
			) : null}
		</div>
	)
}

export default function HebrewTanakhBooks() {
	const [mode, setMode] = useState<StudyMode>('study')
	const [visibleBooks, setVisibleBooks] = useState<Set<string>>(new Set())
	const [visibleHeadings, setVisibleHeadings] = useState<Set<string>>(new Set())
	const [playingSlug, setPlayingSlug] = useState<string | null>(null)
	const [audioNotice, setAudioNotice] = useState<string | null>(null)
	const [gameState, setGameState] = useState<GameState>(() =>
		createInitialGameState(),
	)
	const [draggingId, setDraggingId] = useState<string | null>(null)
	const [hoveredContainerId, setHoveredContainerId] = useState<string | null>(
		null,
	)
	const [showResults, setShowResults] = useState(false)
	const audioRef = useRef<HTMLAudioElement | null>(null)
	const sensors = useSensors(useSensor(PointerSensor))

	useEffect(() => {
		return () => {
			audioRef.current?.pause()
		}
	}, [])

	const handleToggleHeading = (slug: string) => {
		setVisibleHeadings((current) => {
			const next = new Set(current)
			if (next.has(slug)) next.delete(slug)
			else next.add(slug)
			return next
		})
	}

	const handleToggleBook = (slug: string) => {
		setVisibleBooks((current) => {
			const next = new Set(current)
			if (next.has(slug)) next.delete(slug)
			else next.add(slug)
			return next
		})
	}

	const handlePlayAudio = async (
		slug: string,
		englishLabel: string,
		audioSrc?: string,
	) => {
		setAudioNotice(null)

		if (!audioSrc) {
			setPlayingSlug(null)
			setAudioNotice(
				`Audio for ${englishLabel} will be ready once the file is uploaded.`,
			)
			return
		}

		try {
			audioRef.current?.pause()
			const audio = new Audio(audioSrc)
			audioRef.current = audio
			audio.onended = () =>
				setPlayingSlug((current) => (current === slug ? null : current))
			audio.onerror = () => {
				setPlayingSlug((current) => (current === slug ? null : current))
				setAudioNotice(
					`Audio for ${englishLabel} will be ready once the file is uploaded.`,
				)
			}
			setPlayingSlug(slug)
			await audio.play()
		} catch {
			setPlayingSlug(null)
			setAudioNotice(
				`Audio for ${englishLabel} will be ready once the file is uploaded.`,
			)
		}
	}

	const resetGame = () => {
		setGameState(createInitialGameState())
		setDraggingId(null)
		setHoveredContainerId(null)
		setShowResults(false)
	}

	const handleReturnToBank = (slug: string) => {
		setGameState((current) => {
			const source = findBookLocation(slug, current)
			if (!source || source.containerId === BANK_ID) return current

			const sourceSlots = [...(current[source.containerId] as GameSlot[])]
			sourceSlots[source.slotIndex!] = null

			return {
				...current,
				[source.containerId]: sourceSlots,
				bank: [...(current.bank as string[]), slug],
			}
		})
		setShowResults(false)
	}

	const handleDragStart = (event: DragStartEvent) => {
		setDraggingId(String(event.active.id))
		setShowResults(false)
	}

	const handleDragOver = (event: DragOverEvent) => {
		const overId = event.over?.id ? String(event.over.id) : null
		if (!overId) {
			setHoveredContainerId(null)
			return
		}

		const slotTarget = parseSlotId(overId)
		setHoveredContainerId(
			slotTarget?.containerId ?? (overId === BANK_ID ? BANK_ID : null),
		)
	}

	const handleDragEnd = (event: DragEndEvent) => {
		setDraggingId(null)
		setHoveredContainerId(null)

		const activeId = String(event.active.id)
		const overId = event.over?.id ? String(event.over.id) : null
		if (!overId) return

		const slotTarget = parseSlotId(overId)

		if (overId === BANK_ID) {
			handleReturnToBank(activeId)
			return
		}

		if (!slotTarget) return

		setGameState((current) => {
			const source = findBookLocation(activeId, current)
			if (!source) return current

			const nextState: GameState = {
				...current,
				bank: [...(current.bank as string[])],
				[slotTarget.containerId]: [
					...(current[slotTarget.containerId] as GameSlot[]),
				],
			}

			if (source.containerId !== BANK_ID) {
				nextState[source.containerId] = [
					...(current[source.containerId] as GameSlot[]),
				]
			}

			if (source.containerId === BANK_ID) {
				nextState.bank = (nextState.bank as string[]).filter(
					(slug) => slug !== activeId,
				)
			} else {
				;(nextState[source.containerId] as GameSlot[])[source.slotIndex!] = null
			}

			const targetSlots = nextState[slotTarget.containerId] as GameSlot[]
			const displaced = targetSlots[slotTarget.index]
			targetSlots[slotTarget.index] = activeId

			if (displaced && displaced !== activeId) {
				if (source.containerId === BANK_ID) {
					;(nextState.bank as string[]).push(displaced)
				} else {
					;(nextState[source.containerId] as GameSlot[])[source.slotIndex!] =
						displaced
				}
			}

			return nextState
		})
	}

	const isGameComplete =
		(gameState.bank as string[]).length === 0 &&
		groupTargets.every((group) =>
			(gameState[group.id] as GameSlot[]).every(
				(slug, index) => slug === group.books[index]?.slug,
			),
		)

	return (
		<div className="space-y-6">
			<div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white/90 px-5 py-4 text-center shadow-sm">
				<div className="flex flex-col items-center gap-3">
					<div className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-1">
						<button
							type="button"
							onClick={() => setMode('study')}
							className={cn(
								'rounded-full px-5 py-2 text-sm font-bold transition',
								mode === 'study'
									? 'bg-white text-sky-700 shadow-sm'
									: 'text-slate-500 hover:text-slate-700',
							)}
						>
							Study
						</button>
						<button
							type="button"
							onClick={() => setMode('game')}
							className={cn(
								'rounded-full px-5 py-2 text-sm font-bold transition',
								mode === 'game'
									? 'bg-white text-sky-700 shadow-sm'
									: 'text-slate-500 hover:text-slate-700',
							)}
						>
							Game
						</button>
					</div>

					{mode === 'study' ? (
						<>
							<p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">
								Tap to Study
							</p>
							<p className="text-base text-neutral-700">
								Tap any heading or book name to switch between Hebrew and
								English. Use the speaker button to hear the pronunciation.
							</p>
						</>
					) : (
						<>
							<p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">
								Build the TaNaK
							</p>
							<p className="text-base text-neutral-700">
								Each numbered slot is independent. Drop any book directly onto
								the number you want.
							</p>
						</>
					)}

					{audioNotice ? (
						<p className="text-sm font-semibold text-amber-700">
							{audioNotice}
						</p>
					) : null}
				</div>
			</div>

			{mode === 'study' ? (
				<div
					dir="rtl"
					className="space-y-4 xl:flex xl:items-start xl:gap-4 xl:space-y-0"
				>
					{tanakhSections.map((section) => (
						<div
							key={section.id}
							className={cn(section.id === 'neviim' ? 'xl:w-1/2' : 'xl:w-1/4')}
						>
							<SectionCard
								section={section}
								visibleBooks={visibleBooks}
								visibleHeadings={visibleHeadings}
								playingSlug={playingSlug}
								onToggleBook={handleToggleBook}
								onToggleHeading={handleToggleHeading}
								onPlayAudio={handlePlayAudio}
							/>
						</div>
					))}
				</div>
			) : (
				<DndContext
					sensors={sensors}
					collisionDetection={pointerWithin}
					onDragStart={handleDragStart}
					onDragOver={handleDragOver}
					onDragEnd={handleDragEnd}
				>
					<TanakhGame
						gameState={gameState}
						draggingId={draggingId}
						hoveredContainerId={hoveredContainerId}
						showResults={showResults}
						onCheck={() => setShowResults(true)}
						onReset={resetGame}
						onReturnToBank={handleReturnToBank}
						isComplete={showResults && isGameComplete}
					/>
					<DragOverlay>
						{draggingId ? (
							<DraggableBookChip
								id={draggingId}
								book={bookLookup[draggingId]}
								isCorrect={false}
								isOverlay={true}
							/>
						) : null}
					</DragOverlay>
				</DndContext>
			)}
		</div>
	)
}
