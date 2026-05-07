'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, RefreshCw, Shuffle } from 'lucide-react'

import LessonFilter from '@/components/filters/filter-lesson'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLessonCards } from '@/hooks/useLessonCards'
import type { ConstructAbsoluteWord } from '@/lib/data/hebrew/construct-absolute'
import {
	formatHebrewBankPieceDisplay,
	HEBREW_VOWEL_BANK_ITEMS,
} from '@/lib/data/hebrew/hebrew-vowel-bank'
import { cn } from '@/lib/utils'

type HebrewToken =
	| {
			kind: 'letter'
			base: string
			consonantMarks: string
			initialSuffix: string
	  }
	| {
			kind: 'fixed'
			text: string
	  }

type ClusterInfo = {
	raw: string
	base: string
	consonantMarks: string
	vowelMarks: string
	isLetter: boolean
}

type LetterSlot = {
	tokenIndex: number
	base: string
	consonantMarks: string
}

type BankItem = {
	id: string
	text: string
	type: 'suffix' | 'maqaf'
}

type DragPayload = {
	itemText: string
	itemType: 'suffix' | 'maqaf'
}

const HEBREW_MARK_OR_JOINER = /[\u0591-\u05C7\u05BE\u05F3\u05F4]/
const HEBREW_LETTER = /[\u05D0-\u05EA\uFB1D-\uFB4F]/
const HOLAM = '\u05B9'
const MAQAF = '־'
const MATER_LETTERS = new Set(['י', 'ו', 'ה', 'א', 'וּ'])
const CONSONANT_MARKS = new Set(['\u05BC', '\u05BF', '\u05C1', '\u05C2'])
const DRAG_PAYLOAD_MIME = 'application/x-construct-absolute-piece'

const MAQAF_BANK_ITEM = {
	id: 'maqaf',
	text: MAQAF,
	type: 'maqaf' as const,
}

function splitHebrewClusters(input: string) {
	const chars = Array.from(input)
	const clusters: string[] = []

	for (const char of chars) {
		if (
			clusters.length > 0 &&
			(HEBREW_MARK_OR_JOINER.test(char) || /\p{Mark}/u.test(char))
		) {
			clusters[clusters.length - 1] += char
			continue
		}

		clusters.push(char)
	}

	return clusters
}

function splitClusterParts(cluster: string): ClusterInfo {
	const [base, ...rest] = Array.from(cluster)
	const consonantMarks = rest
		.filter((char) => CONSONANT_MARKS.has(char))
		.join('')
	const vowelMarks = rest
		.filter((char) => !CONSONANT_MARKS.has(char))
		.join('')

	return {
		raw: cluster,
		base,
		consonantMarks,
		vowelMarks,
		isLetter: HEBREW_LETTER.test(base),
	}
}

function shouldAttachAsMater(current: ClusterInfo, next?: ClusterInfo) {
	if (!next || !next.isLetter || !MATER_LETTERS.has(next.base)) return false

	if (next.base === 'ו' && next.vowelMarks.includes(HOLAM)) {
		return true
	}

	if (!current.isLetter) return false

	return current.vowelMarks.length > 0 && !next.consonantMarks && !next.vowelMarks
}

function tokenizeWord(word: string): HebrewToken[] {
	const clusters = splitHebrewClusters(word).map(splitClusterParts)
	const tokens: HebrewToken[] = []

	for (let index = 0; index < clusters.length; index += 1) {
		const current = clusters[index]

		if (!current.isLetter) {
			tokens.push({ kind: 'fixed', text: current.raw })
			continue
		}

		let suffix = current.vowelMarks
		let lookahead = index + 1

		while (lookahead < clusters.length && shouldAttachAsMater(current, clusters[lookahead])) {
			suffix += clusters[lookahead].raw
			lookahead += 1
		}

		tokens.push({
			kind: 'letter',
			base: current.base,
			consonantMarks: current.consonantMarks,
			initialSuffix: suffix,
		})

		index = lookahead - 1
	}

	return tokens
}

function getLetterSkeleton(tokens: HebrewToken[]) {
	return tokens
		.filter((token): token is Extract<HebrewToken, { kind: 'letter' }> => token.kind === 'letter')
		.map((token) => token.base)
		.join('')
}

function canBuildWord(word: ConstructAbsoluteWord) {
	return (
		getLetterSkeleton(tokenizeWord(word.absolute)) ===
		getLetterSkeleton(tokenizeWord(word.construct.replaceAll(MAQAF, '')))
	)
}

function normalizeHebrewForComparison(word: string) {
	return tokenizeWord(word)
		.map((token) => {
			if (token.kind === 'fixed') return token.text
			return `${token.base}${token.consonantMarks}${token.initialSuffix}`
		})
		.join('')
		.normalize('NFC')
}

function shuffle<T>(items: T[]) {
	return [...items].sort(() => Math.random() - 0.5)
}

function setDragPayload(dataTransfer: DataTransfer, payload: DragPayload) {
	dataTransfer.setData(DRAG_PAYLOAD_MIME, JSON.stringify(payload))
	dataTransfer.setData('text/plain', payload.itemText)
	dataTransfer.effectAllowed = 'move'
}

function getDragPayload(dataTransfer: DataTransfer): DragPayload | null {
	const rawPayload = dataTransfer.getData(DRAG_PAYLOAD_MIME)

	if (rawPayload) {
		try {
			return JSON.parse(rawPayload) as DragPayload
		} catch {
			return null
		}
	}

	const itemText = dataTransfer.getData('text/plain')
	return itemText ? { itemText, itemType: 'suffix' } : null
}

export default function HebrewConstructAbsoluteConversion({
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

	const playableWords = useMemo(
		() => filteredWords.filter((word) => canBuildWord(word)),
		[filteredWords]
	)
	const [deck, setDeck] = useState<ConstructAbsoluteWord[]>(() =>
		shuffle(playableWords)
	)
	const [index, setIndex] = useState(0)
	const [slotValues, setSlotValues] = useState<Record<number, string>>({})
	const [maqafSelected, setMaqafSelected] = useState(false)
	const [selectedItem, setSelectedItem] = useState<BankItem | null>(null)
	const [submitted, setSubmitted] = useState(false)
	const [showAnswer, setShowAnswer] = useState(false)

	useEffect(() => {
		setDeck(shuffle(playableWords))
		setIndex(0)
	}, [playableWords])

	const currentWord = deck[index] ?? null
	const tokens = useMemo(
		() => (currentWord ? tokenizeWord(currentWord.absolute) : []),
		[currentWord]
	)
	const letterSlots = useMemo(
		() =>
			tokens.flatMap((token, tokenIndex) =>
				token.kind === 'letter'
					? [
							{
								tokenIndex,
								base: token.base,
								consonantMarks: token.consonantMarks,
							} satisfies LetterSlot,
					  ]
					: []
			),
		[tokens]
	)
	const bankItems = useMemo(
		() => [...HEBREW_VOWEL_BANK_ITEMS, MAQAF_BANK_ITEM],
		[]
	)
	const editableCount = letterSlots.length

	useEffect(() => {
		setSlotValues({})
		setMaqafSelected(false)
		setSelectedItem(null)
		setSubmitted(false)
		setShowAnswer(false)
	}, [index])

	const currentAttempt = useMemo(() => {
		const builtWord = tokens
			.map((token, tokenIndex) => {
				if (token.kind !== 'letter') return token.text

				const slotIndex = letterSlots.findIndex(
					(slot) => slot.tokenIndex === tokenIndex
				)
				const suffix = slotIndex >= 0 ? slotValues[slotIndex] ?? '' : ''

				return `${token.base}${token.consonantMarks}${suffix}`
			})
			.join('')

		return maqafSelected ? `${builtWord}${MAQAF}` : builtWord
	}, [letterSlots, maqafSelected, slotValues, tokens])

	const isCorrect = currentWord
		? normalizeHebrewForComparison(currentAttempt) ===
			normalizeHebrewForComparison(currentWord.construct)
		: false

	function clearSlot(slotIndex: number) {
		setSlotValues((current) => {
			const next = { ...current }
			delete next[slotIndex]
			return next
		})
		setSubmitted(false)
	}

	function placeSuffix(slotIndex: number, suffix: string) {
		setSlotValues((current) => ({
			...current,
			[slotIndex]: suffix,
		}))
		setSelectedItem(null)
		setSubmitted(false)
	}

	function placeMaqaf(enabled: boolean) {
		setMaqafSelected(enabled)
		setSelectedItem(null)
		setSubmitted(false)
	}

	function handleDropToSlot(event: React.DragEvent<HTMLDivElement>, slotIndex: number) {
		event.preventDefault()
		const payload = getDragPayload(event.dataTransfer)
		if (!payload) return

		if (payload.itemType !== 'suffix') return
		placeSuffix(slotIndex, payload.itemText)
	}

	function handleDropToMaqaf(event: React.DragEvent<HTMLDivElement>) {
		event.preventDefault()
		const payload = getDragPayload(event.dataTransfer)
		if (!payload) return

		if (payload.itemType !== 'maqaf') return
		placeMaqaf(true)
	}

	function handleSubmit() {
		setSubmitted(true)
		if (isCorrect) {
			setShowAnswer(true)
		}
	}

	function handleResetWord() {
		setSlotValues({})
		setMaqafSelected(false)
		setSelectedItem(null)
		setSubmitted(false)
		setShowAnswer(false)
	}

	function handleNextWord() {
		setIndex((currentIndex) => (currentIndex + 1) % deck.length)
	}

	function handleShuffleDeck() {
		setDeck(shuffle(playableWords))
		setIndex(0)
		setSlotValues({})
		setMaqafSelected(false)
		setSelectedItem(null)
		setSubmitted(false)
		setShowAnswer(false)
	}

	if (!currentWord) {
		return (
			<div className="w-full max-w-4xl space-y-6">
				<LessonFilter
					data={lessonFilterData}
					selectedLessons={selectedLessons}
					setSelectedLessons={setSelectedLessons}
					showRanges
				/>
				<Card className="border-sidebar-border bg-white/85 shadow-sm">
					<CardContent className="p-8 text-center text-neutral-600">
						No construct-builder words are available yet.
					</CardContent>
				</Card>
			</div>
		)
	}

	return (
		<div className="w-full max-w-4xl space-y-6">
			<LessonFilter
				data={lessonFilterData}
				selectedLessons={selectedLessons}
				setSelectedLessons={setSelectedLessons}
				showRanges
			/>
			<Card className="border-sidebar-border bg-white/85 shadow-sm">
				<CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
					<div className="grid gap-3 sm:grid-cols-3">
						<div>
							<p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500">
								Lesson
							</p>
							<p className="mt-1 text-2xl font-extrabold tracking-tight text-neutral-800">
								{currentWord.lessonNumber || 'Starter'}
							</p>
						</div>
						<div>
							<p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500">
								Prompt
							</p>
							<p className="mt-1 text-lg font-bold text-neutral-700">
								Absolute to Construct
							</p>
						</div>
						<div>
							<p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500">
								Drop Zones
							</p>
							<p className="mt-1 text-2xl font-extrabold tracking-tight text-neutral-800">
								{editableCount}
							</p>
						</div>
					</div>

					<div className="flex gap-3">
						<Button type="button" variant="secondary" className="gap-2" onClick={handleResetWord}>
							<RefreshCw className="h-4 w-4" />
							Reset Word
						</Button>
						<Button type="button" variant="secondary" className="gap-2" onClick={handleShuffleDeck}>
							<Shuffle className="h-4 w-4" />
							New Round
						</Button>
					</div>
				</CardContent>
			</Card>

			<Card className="border-sidebar-border bg-white/90 shadow-sm">
				<CardHeader className="space-y-3">
					<CardTitle className="text-2xl text-neutral-800">
						Build The Construct Form
					</CardTitle>
					<p className="text-sm leading-6 text-neutral-600">
						Drag vowels from the full bank onto the consonants. The maqqef has
						its own drop zone to the left of the word for every card. You can
						also tap a bank piece and then tap a drop zone if dragging feels
						clumsy.
					</p>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="rounded-3xl border border-sidebar-border bg-sidebar-accent/20 p-6">
						<div className="flex flex-wrap justify-center gap-3" dir="rtl">
							{letterSlots.map((slot, slotIndex) => {
								const suffixText = slotValues[slotIndex] ?? ''

								return (
									<div
										key={`${slot.base}-${slot.tokenIndex}`}
										className="flex min-w-[92px] flex-col items-center gap-2 rounded-2xl border border-sky-200 bg-white px-3 py-4 shadow-sm"
									>
										<div className="font-cardo text-5xl leading-none text-neutral-800">
											{`${slot.base}${slot.consonantMarks}`}
										</div>

										<div
											role="button"
											tabIndex={0}
											onClick={() => {
												if (!selectedItem || selectedItem.type !== 'suffix') return
												placeSuffix(slotIndex, selectedItem.text)
											}}
											onKeyDown={(event) => {
												if (event.key !== 'Enter' && event.key !== ' ') return
												event.preventDefault()
												if (!selectedItem || selectedItem.type !== 'suffix') return
												placeSuffix(slotIndex, selectedItem.text)
											}}
											onDragOver={(event) => {
												event.preventDefault()
												event.dataTransfer.dropEffect = 'move'
											}}
											onDrop={(event) => handleDropToSlot(event, slotIndex)}
											className={cn(
												'flex min-h-14 min-w-[64px] items-center justify-center rounded-xl border-2 border-dashed px-3 py-2 transition',
												suffixText
													? 'border-emerald-400 bg-emerald-50'
													: 'border-sky-300 bg-sky-50'
											)}
										>
											{suffixText ? (
												<button
													type="button"
													onClick={() => clearSlot(slotIndex)}
													className="flex h-12 min-w-[56px] items-center justify-center overflow-hidden rounded-lg bg-white px-3 py-1 font-cardo text-3xl leading-none text-neutral-800 shadow-sm"
												>
													<span dir="rtl">
														{formatHebrewBankPieceDisplay(suffixText)}
													</span>
												</button>
											) : (
												<span className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
													Vowel
												</span>
											)}
										</div>

									</div>
								)
							})}

							<div className="flex min-w-[92px] flex-col items-center gap-2 rounded-2xl border border-amber-200 bg-white px-3 py-4 shadow-sm">
								<div className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500">
									Maqqef?
								</div>
								<div
									role="button"
									tabIndex={0}
									onClick={() => {
										if (!selectedItem || selectedItem.type !== 'maqaf') return
										placeMaqaf(true)
									}}
									onKeyDown={(event) => {
										if (event.key !== 'Enter' && event.key !== ' ') return
										event.preventDefault()
										if (!selectedItem || selectedItem.type !== 'maqaf') return
										placeMaqaf(true)
									}}
									onDragOver={(event) => {
										event.preventDefault()
										event.dataTransfer.dropEffect = 'move'
									}}
									onDrop={handleDropToMaqaf}
									className={cn(
										'flex min-h-14 min-w-[64px] items-center justify-center rounded-xl border-2 border-dashed px-3 py-2 transition',
										maqafSelected
											? 'border-amber-400 bg-amber-50'
											: 'border-amber-200 bg-amber-50/60'
									)}
								>
									{maqafSelected ? (
										<button
											type="button"
											onClick={() => placeMaqaf(false)}
											className="flex h-12 min-w-[56px] items-center justify-center overflow-hidden rounded-lg bg-white px-3 py-1 font-cardo text-3xl leading-none text-neutral-800 shadow-sm"
										>
											{MAQAF}
										</button>
									) : (
										<span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
											Drop Here
										</span>
									)}
								</div>
							</div>
						</div>
					</div>

					<div className="rounded-2xl border border-sidebar-border bg-white p-4">
						<div className="flex items-center justify-between gap-3">
							<div>
								<p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500">
									Piece Bank
								</p>
								<p className="mt-1 text-sm text-neutral-600">
									Every vowel is always available here, plus the maqqef.
								</p>
							</div>
						</div>
						<div className="mt-4 flex flex-wrap justify-center gap-3" dir="rtl">
							{bankItems.map((item) => {
								return (
									<button
										key={item.id}
										type="button"
										draggable
										onDragStart={(event) =>
											setDragPayload(event.dataTransfer, {
												itemText: item.text,
												itemType: item.type,
											})
										}
										onClick={() => setSelectedItem((current) => (current?.id === item.id ? null : item))}
										className={cn(
											'flex h-[76px] min-w-[76px] items-center justify-center overflow-hidden rounded-2xl border px-3 py-2 font-cardo text-3xl leading-none text-neutral-800 shadow-sm transition',
											item.type === 'maqaf'
												? 'border-amber-300 bg-amber-50'
												: 'border-sky-300 bg-sky-50',
											selectedItem?.id === item.id &&
												'ring-2 ring-sky-400 ring-offset-2'
										)}
									>
										<span dir="rtl">
											{item.type === 'maqaf'
												? item.text
												: formatHebrewBankPieceDisplay(item.text)}
										</span>
									</button>
								)
							})}
						</div>
					</div>

					<div className="grid gap-4 md:grid-cols-2">
						<div className="rounded-2xl border border-sidebar-border bg-white p-4">
							<p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500">
								Absolute
							</p>
							<p className="mt-2 font-cardo text-3xl text-neutral-800">
								{currentWord.absolute}
							</p>
						</div>
						<div className="rounded-2xl border border-sidebar-border bg-white p-4">
							<p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500">
								Your Attempt
							</p>
							<p className="mt-2 font-cardo text-3xl text-neutral-800">
								{currentAttempt}
							</p>
							<p className="mt-2 text-sm text-neutral-600">
								Leave a consonant blank if you think it takes no vowel here.
							</p>
						</div>
					</div>

					{submitted ? (
						<div
							className={cn(
								'rounded-2xl border px-5 py-4 text-sm leading-6',
								isCorrect
									? 'border-emerald-300 bg-emerald-50 text-emerald-800'
									: 'border-amber-300 bg-amber-50 text-amber-900'
							)}
						>
							{isCorrect ? (
								<div className="flex items-start gap-3">
									<Check className="mt-0.5 h-5 w-5 shrink-0" />
									<div>
										<p className="font-bold">Correct.</p>
										<p>You built the construct form from the consonant frame.</p>
									</div>
								</div>
							) : (
								<div>
									<p className="font-bold">Not yet.</p>
									<p>
										Move the pieces around, or click one to send it back to the
										bank and try again.
									</p>
								</div>
							)}
						</div>
					) : null}

					{showAnswer ? (
						<div className="rounded-2xl border border-emerald-300 bg-white p-4">
							<p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500">
								Construct Form
							</p>
							<p className="mt-2 font-cardo text-3xl text-neutral-800">
								{currentWord.construct}
							</p>
						</div>
					) : null}

					<div className="flex flex-col gap-3 sm:flex-row">
						<Button type="button" variant="primary" onClick={handleSubmit}>
							Submit
						</Button>
						<Button type="button" variant="secondary" onClick={handleNextWord}>
							Next Word
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
