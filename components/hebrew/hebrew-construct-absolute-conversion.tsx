'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, RefreshCw, Shuffle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ConstructAbsoluteWord } from '@/lib/data/hebrew/construct-absolute'
import { hebrewNiqqud } from '@/lib/data/hebrew/hebrew-niqqud'
import { cn } from '@/lib/utils'

type HebrewToken =
	| {
			kind: 'letter'
			base: string
			consonantMarks: string
			initialSuffix: string
			options: string[]
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

const HEBREW_MARK_OR_JOINER = /[\u0591-\u05C7\u05BE\u05F3\u05F4]/
const HEBREW_LETTER = /[\u05D0-\u05EA\uFB1D-\uFB4F]/
const HOLAM = '\u05B9'
const MAQAF = '־'
const MATER_LETTERS = new Set(['י', 'ו', 'ה', 'א', 'וּ'])
const CONSONANT_MARKS = new Set(['\u05BC', '\u05BF', '\u05C1', '\u05C2'])
const NON_VOWEL_KEYS = new Set(['dagesh', 'rafe', 'shin-dot'])

const VOWEL_SUFFIXES = Array.from(
	new Set(
		hebrewNiqqud
			.filter((item) => !NON_VOWEL_KEYS.has(item.key))
			.map((item) => item.char.slice(1))
			.filter((item) => item.length > 0)
	)
)

const ALL_VOWEL_OPTIONS = ['' as string, ...VOWEL_SUFFIXES]

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
			options: Array.from(new Set([suffix, ...ALL_VOWEL_OPTIONS])),
		})

		index = lookahead - 1
	}

	return tokens
}

function withMaqefOption(tokens: HebrewToken[], targetWord: string) {
	const maqefTarget = targetWord.endsWith(MAQAF)
	if (!maqefTarget) return tokens

	for (let index = tokens.length - 1; index >= 0; index -= 1) {
		const token = tokens[index]
		if (token.kind !== 'letter') continue

		const maqefOptions = Array.from(
			new Set([
				...token.options,
				`${token.initialSuffix}${MAQAF}`,
				MAQAF,
			])
		)

		return [
			...tokens.slice(0, index),
			{
				...token,
				options: maqefOptions,
			},
			...tokens.slice(index + 1),
		]
	}

	return tokens
}

function getLetterSkeleton(tokens: HebrewToken[]) {
	return tokens
		.filter((token): token is Extract<HebrewToken, { kind: 'letter' }> => token.kind === 'letter')
		.map((token) => token.base)
		.join('')
}

function canCycleWord(word: ConstructAbsoluteWord) {
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

export default function HebrewConstructAbsoluteConversion({
	words,
}: {
	words: ConstructAbsoluteWord[]
}) {
	const playableWords = useMemo(
		() => words.filter((word) => canCycleWord(word)),
		[words]
	)
	const [deck, setDeck] = useState<ConstructAbsoluteWord[]>(() =>
		shuffle(playableWords)
	)
	const [index, setIndex] = useState(0)
	const [currentSuffixes, setCurrentSuffixes] = useState<string[]>([])
	const [submitted, setSubmitted] = useState(false)
	const [showAnswer, setShowAnswer] = useState(false)

	useEffect(() => {
		setDeck(shuffle(playableWords))
		setIndex(0)
	}, [playableWords])

	const currentWord = deck[index] ?? null
	const tokens = useMemo(
		() =>
			currentWord
				? withMaqefOption(tokenizeWord(currentWord.absolute), currentWord.construct)
				: [],
		[currentWord]
	)

	useEffect(() => {
		setCurrentSuffixes(
			tokens.map((token) => (token.kind === 'letter' ? token.initialSuffix : ''))
		)
		setSubmitted(false)
		setShowAnswer(false)
	}, [tokens, index])

	const currentAttempt = useMemo(
		() =>
			tokens
				.map((token, tokenIndex) =>
					token.kind === 'letter'
						? `${token.base}${token.consonantMarks}${currentSuffixes[tokenIndex] ?? token.initialSuffix}`
						: token.text
				)
				.join(''),
		[currentSuffixes, tokens]
	)

	const isCorrect = currentWord
		? normalizeHebrewForComparison(currentAttempt) ===
			normalizeHebrewForComparison(currentWord.construct)
		: false
	const editableCount = tokens.filter((token) => token.kind === 'letter').length

	function cycleToken(tokenIndex: number) {
		const token = tokens[tokenIndex]
		if (!token || token.kind !== 'letter') return

		const currentSuffix = currentSuffixes[tokenIndex] ?? token.initialSuffix
		const optionIndex = token.options.indexOf(currentSuffix)
		const nextSuffix =
			token.options[(optionIndex + 1 + token.options.length) % token.options.length]

		setCurrentSuffixes((current) =>
			current.map((value, indexValue) =>
				indexValue === tokenIndex ? nextSuffix : value
			)
		)
		setSubmitted(false)
	}

	function handleSubmit() {
		setSubmitted(true)
		if (isCorrect) {
			setShowAnswer(true)
		}
	}

	function handleResetWord() {
		setCurrentSuffixes(
			tokens.map((token) => (token.kind === 'letter' ? token.initialSuffix : ''))
		)
		setSubmitted(false)
		setShowAnswer(false)
	}

	function handleNextWord() {
		setIndex((currentIndex) => (currentIndex + 1) % deck.length)
	}

	function handleShuffleDeck() {
		setDeck(shuffle(playableWords))
		setIndex(0)
		setCurrentSuffixes([])
		setSubmitted(false)
		setShowAnswer(false)
	}

	if (!currentWord) {
		return (
			<Card className="w-full max-w-4xl border-sidebar-border bg-white/85 shadow-sm">
				<CardContent className="p-8 text-center text-neutral-600">
					No vowel-cycling construct/absolute words are available yet.
				</CardContent>
			</Card>
		)
	}

	return (
		<div className="w-full max-w-4xl space-y-6">
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
								Editable Spots
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
						Change The Absolute Form
					</CardTitle>
					<p className="text-sm leading-6 text-neutral-600">
						Start with the absolute form. Tap any Hebrew letter to cycle
						through vowel spellings, including fuller patterns like hiriq-yod
						and holam-male, then submit when you think the word is ready.
					</p>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="rounded-3xl border border-sidebar-border bg-sidebar-accent/20 p-6">
						<div className="mt-5 flex flex-wrap justify-center gap-2" dir="rtl">
							{tokens.map((token, tokenIndex) => {
								if (token.kind !== 'letter') {
									return (
										<span
											key={`${token.text}-${tokenIndex}`}
											className="px-1 font-cardo text-4xl leading-none text-neutral-800"
										>
											{token.text}
										</span>
									)
								}

								const currentSuffix =
									currentSuffixes[tokenIndex] ?? token.initialSuffix
								const isChanged = currentSuffix !== token.initialSuffix

								return (
									<button
										key={`${token.base}-${tokenIndex}`}
										type="button"
										onClick={() => cycleToken(tokenIndex)}
										className={cn(
											'rounded-2xl border px-3 py-3 transition',
											'font-cardo text-4xl leading-none text-neutral-800',
											'border-sky-300 bg-sky-50 hover:border-sky-500 hover:bg-sky-100',
											isChanged && 'border-emerald-400 bg-emerald-50'
										)}
									>
										{`${token.base}${token.consonantMarks}${currentSuffix}`}
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
								Submit to check whether it matches the construct form.
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
										<p>
											You changed the absolute form into the construct form.
										</p>
									</div>
								</div>
							) : (
								<div>
									<p className="font-bold">Not yet.</p>
									<p>
										Try another vowel change, or reset this word and test again.
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
