// components/hebrew/HebrewReader.tsx

'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

import {
	Popover,
	PopoverTrigger,
	PopoverContent,
} from '@/components/ui/popover'

import {
	Select,
	SelectTrigger,
	SelectContent,
	SelectItem,
	SelectValue,
	SelectSeparator,
} from '@/components/ui/select'

import { Slider } from '@/components/ui/slider'
import { useClientLocalStorage } from '@/hooks/use-client-local-storage'
import { useTranslations } from 'next-intl'

interface HebrewWord {
	id: string
	surface: string
	lemma: string | null
	lemmaVocalized: string | null
	partOfSpeech: string | null
	verbStem: string | null
	verbTense: string | null
	verseId: string
	wordSeq: number
}

interface HebrewReaderProps {
	words: HebrewWord[]
	bookName: string // display name ("2 Kings")
	bookSlug: string // URL slug ("2_kings")
	chapterNumber: number
	locale: string
}

const fontMap: Record<string, string> = {
	FrankRuehl: 'var(--font-frank-ruhl), Times New Roman, serif',
	Tinos: 'var(--font-tinos)',
	Cardo: 'var(--font-cardo)',
	Rashi: 'var(--font-rashi)',
	Suez: 'var(--font-suez-one), sans-serif',
	Times: '"Times New Roman", serif',
	Nunito: 'var(--font-nunito)',
}

/* -------------------------------------------------------
   BHS-Aware Prefix/Maqqef Grouping
--------------------------------------------------------- */

const PREFIX_POS = new Set(['prep', 'conj', 'art'])
const MAQQEF = '\u05BE'
const PREFIX_LETTERS = new Set(['ב', 'כ', 'ל', 'מ', 'ו', 'ה'])

/* -------------------------------------------------------
   MARK REMOVAL (Niqqud / Cantillation)
--------------------------------------------------------- */

// Cantillation marks: 0591–05AF
const CANTILLATION_RE = /[\u0591-\u05AF]/g
// Niqqud: 05B0–05BC, 05BD–05C7
const NIQQUD_RE = /[\u05B0-\u05BC\u05BD-\u05C7]/g

function stripCantillation(text: string) {
	return text.replace(CANTILLATION_RE, '')
}

function stripNiqqud(text: string) {
	return text.replace(NIQQUD_RE, '')
}

function stripAll(text: string) {
	return text.replace(CANTILLATION_RE, '').replace(NIQQUD_RE, '')
}

function stripMq(text: string) {
	return text.replace(MAQQEF, '')
}

function isPrefix(w: HebrewWord): boolean {
	if (!w.partOfSpeech) return false
	if (!PREFIX_POS.has(w.partOfSpeech)) return false

	const clean = stripMq(w.surface)
	if (clean.length > 5) return false
	return PREFIX_LETTERS.has(clean[0])
}

function hasMq(w: HebrewWord) {
	return w.surface.includes(MAQQEF)
}

function groupVerseWords(words: HebrewWord[]) {
	const sorted = [...words].sort((a, b) => a.wordSeq - b.wordSeq)
	const out: { id: string; words: HebrewWord[] }[] = []
	let buf: HebrewWord[] = []

	const flush = () => {
		if (buf.length > 0) {
			out.push({ id: buf.map((w) => w.id).join('-'), words: [...buf] })
			buf = []
		}
	}

	for (let i = 0; i < sorted.length; i++) {
		const w = sorted[i]
		const next = sorted[i + 1]
		buf.push(w)

		if (hasMq(w) && next) continue
		if (isPrefix(w) && next) continue

		flush()
	}

	flush()
	return out
}

/* -------------------------------------------------------
   COMPONENT
--------------------------------------------------------- */

export default function HebrewReader({
	words,
	bookName,
	bookSlug,
	chapterNumber,
	locale,
}: HebrewReaderProps) {
	const [selectedId, setSelectedId] = useState<string | null>(null)
	const [openPopoverId, setOpenPopoverId] = useState<string | null>(null)
	const [displayMode, setDisplayMode] = useClientLocalStorage<
		'full' | 'vowels' | 'consonantal'
	>('hebrewDisplayMode', 'vowels')

	const [fontFamily, setFontFamily] = useClientLocalStorage(
		'hebrewFontFamily',
		'Times'
	)

	const [fontSize, setFontSize] = useClientLocalStorage('hebrewFontSize', 36)
	const [wordGap, setWordGap] = useClientLocalStorage('hebrewWordGap', 15)
	const tReader = useTranslations('reader')
	const tVocab = useTranslations('heb-vocab')

	const verses = useMemo(() => {
		const m: Record<string, HebrewWord[]> = {}
		for (const w of words) {
			if (!m[w.verseId]) m[w.verseId] = []
			m[w.verseId].push(w)
		}
		return m
	}, [words])

	const next = chapterNumber + 1
	const prev = chapterNumber - 1
	const baseUrl = `/${locale}/reader/hebrew/${bookSlug}`

	const resetSelection = () => {
		setSelectedId(null)
		setOpenPopoverId(null)
	}

	return (
		<div className="flex flex-col gap-6" dir="rtl" onClick={resetSelection}>
			{/* =========================
				  TOP NAV
			========================= */}
			<div className="flex justify-between items-center w-full mb-2" dir="ltr">
				<Link href={`${baseUrl}/${next}`}>
					<Button variant="outline">{tReader('nav.next')}</Button>
				</Link>

				<h1 className="text-2xl font-bold">
					{bookName} {chapterNumber}
				</h1>
				{prev > 0 ? (
					<Link href={`${baseUrl}/${prev}`}>
						<Button variant="outline">{tReader('nav.prev')}</Button>
					</Link>
				) : (
					<div />
				)}
			</div>

			{/* =========================
				  FONT CONTROLS
			========================= */}
			<div
				className="flex flex-col md:flex-row md:justify-between gap-6 items-center px-2"
				dir="ltr"
			>
				<div className="w-40">
					<Select value={fontFamily} onValueChange={setFontFamily}>
						<SelectTrigger>
							<SelectValue placeholder="Font" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="Times">Times</SelectItem>
							<SelectItem value="FrankRuehl">Frank Ruehl</SelectItem>
							<SelectItem value="Tinos">Tinos</SelectItem>
							<SelectItem value="Cardo">Cardo</SelectItem>
							<SelectItem value="Rashi">Rashi</SelectItem>
							<SelectItem value="Suez">Suez</SelectItem>
							<SelectSeparator />
							<SelectItem value="Sans">San Serif</SelectItem>
							<SelectItem value="Nunito">Nunito</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{/* DISPLAY MODE */}
				<div className="w-40">
					<Select value={displayMode} onValueChange={setDisplayMode}>
						<SelectTrigger>
							<SelectValue placeholder="Display" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="full">
								Full Text (Cantillation + Vowels)
							</SelectItem>
							<SelectItem value="vowels">Vowels Only</SelectItem>
							<SelectItem value="consonantal">Consonantal Only</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div className="flex items-center gap-2">
					<span className="text-sm">Aa</span>
					<Slider
						defaultValue={[36]}
						min={20}
						max={60}
						step={1}
						onValueChange={(v) => setFontSize(v[0])}
						className="w-40"
					/>
					<span className="text-lg">Aa</span>
				</div>
				<div className="flex items-center gap-2">
					<span className="text-sm">{tReader('gap')}</span>
					<Slider
						defaultValue={[wordGap]}
						min={10}
						max={30}
						step={5}
						value={[wordGap]}
						onValueChange={(v) => setWordGap(v[0])}
						className="w-40"
					/>
					<span className="text-sm">{wordGap}px</span>
				</div>
			</div>

			<Separator className="my-1" />

			{/* =========================
				  MAIN BIBLE TEXT
			========================= */}
			<div
				className="p-2 md:p-4 leading-relaxed text-right w-full"
				style={{
					fontFamily: fontMap[fontFamily],
					fontSize: `${fontSize}px`,
				}}
			>
				{Object.entries(verses).map(([verseId, rawWords]) => {
					const verseNum = verseId.split('-').pop()
					const groups = groupVerseWords(rawWords)

					return (
						<div
							key={verseId}
							dir="rtl"
							className="mb-4 flex items-baseline gap-4"
						>
							{/* Verse Number (fixed at right side) */}
							<span className="text-gray-500 text-xl select-none shrink-0">
								{verseNum}
							</span>

							{/* Verse Text (full width, right aligned) */}
							<div
								className="flex flex-wrap items-center"
								style={{ gap: `${wordGap}px` }}
							>
								{' '}
								{groups.map((group) => (
									<span key={group.id} className="flex gap-0">
										{group.words.map((w) => {
											const isSelected = w.id === selectedId
											const key = (w.lemma ?? '').trim()

											return (
												<Popover
													key={w.id}
													open={openPopoverId === w.id}
													onOpenChange={(open) => !open && resetSelection()}
												>
													<PopoverTrigger asChild>
														<span
															onClick={(e) => {
																e.stopPropagation()
																e.currentTarget.style.color = '' // ← clear previous hover tint

																setSelectedId(w.id)
																setOpenPopoverId(w.id)
															}}
															className={`inline-block cursor-pointer transition-colors
      ${isSelected ? 'text-sky-500' : 'text-black'}
    `}
															onMouseEnter={(e) => {
																if (!isSelected)
																	e.currentTarget.style.color = '#0ea5e9'
															}}
															onMouseLeave={(e) => {
																e.currentTarget.style.color = ''
															}}
														>
															{(() => {
																if (displayMode === 'consonantal')
																	return stripAll(w.surface)
																if (displayMode === 'vowels')
																	return stripCantillation(w.surface)
																return w.surface
															})()}
														</span>
													</PopoverTrigger>

													<PopoverContent
														side="top"
														className="w-64 text-lg p-4 space-y-1"
														dir="ltr"
													>
														{' '}
														<div
															style={{ fontFamily: fontMap[fontFamily] }}
															className="text-2xl mb-2"
														>
															{' '}
															{w.surface}{' '}
														</div>{' '}
														<div>
															{' '}
															<strong>{tReader('grammar.lemma')}:</strong>{' '}
															<span style={{ fontFamily: fontMap[fontFamily] }}>
																{' '}
																{w.lemmaVocalized}{' '}
															</span>{' '}
														</div>{' '}
														<div>
															{' '}
															<strong>{tReader('grammar.root')}:</strong>{' '}
															{w.lemma}{' '}
														</div>{' '}
														{tVocab.has(key) && (
															<div>
																<strong>
																	{tReader('grammar.translation')}:
																</strong>{' '}
																{tVocab(key)}
															</div>
														)}
														<div>
															{' '}
															<strong>{tReader('grammar.pos')}:</strong>{' '}
															{tReader(`pos.${w.partOfSpeech}`)}{' '}
														</div>{' '}
														{w.partOfSpeech === 'verb' && (
															<>
																{' '}
																<div>
																	{' '}
																	<strong>
																		{tReader('grammar.stem')}:
																	</strong>{' '}
																	{w.verbStem}{' '}
																</div>{' '}
																<div>
																	{' '}
																	<strong>
																		{tReader('grammar.tense')}:
																	</strong>{' '}
																	{w.verbTense}{' '}
																</div>{' '}
															</>
														)}{' '}
													</PopoverContent>
												</Popover>
											)
										})}
									</span>
								))}
								{/* Sof pasuq */}
								<span
									style={{ fontFamily: fontMap[fontFamily] }}
									// className="-mr-2"
								>
									׃
								</span>
							</div>
						</div>
					)
				})}
			</div>
		</div>
	)
}
