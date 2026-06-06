'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { HebrewVocab } from '@/lib/vocab'
import {
	formatRootGenderDisplay,
	getRootMorphologyParts,
	hasRootMorphology,
} from '@/lib/vocab-morphology'
import { resolveVocabMediaUrl } from '@/lib/vocab-media'
import Image from 'next/image'
import { Bookmark, ImageIcon, Star } from 'lucide-react'
import HebrewKeyboard from './hebrew-keyboard'
import { RootMorphologyIcons } from './root-morphology-icons'
import { useUserId } from '@/hooks/useUserId'

type CardStatus = {
	isMastered: boolean
	inMyStack: boolean
}

interface DictionaryProps {
	data: HebrewVocab[]
	courseId: number
}

const hebrewAlphabet = [
	'א',
	'ב',
	'ג',
	'ד',
	'ה',
	'ו',
	'ז',
	'ח',
	'ט',
	'י',
	'כ',
	'ל',
	'מ',
	'נ',
	'ס',
	'ע',
	'פ',
	'צ',
	'ק',
	'ר',
	'ש',
	'ת',
]

function toAbsoluteUrl(src: string) {
	if (!src) return src
	return resolveVocabMediaUrl(src)
}

function stripHebrewMarks(text: string): string {
	return text.normalize('NFD').replace(/[\u0591-\u05C7]/g, '')
}

function getLessonNumberFromString(input: string | undefined): number | null {
	if (!input) return null
	const match = input.match(/\d+/) // Finds first number in string
	return match ? parseInt(match[0], 10) : null
}

function getEntryProgressKey(entry: HebrewVocab): string {
	if (typeof entry.id === 'number') return `id:${entry.id}`
	return `fallback:${entry.heb}:${entry.hebNiqqud ?? ''}:${entry.eng ?? ''}`
}

export default function HebrewDictionary({ data, courseId }: DictionaryProps) {
	const [expandedId, setExpandedId] = useState<number | null>(null)
	const [activeLetter, setActiveLetter] = useState<string>('א')
	const [sortMode, setSortMode] = useState<'alphabetical' | 'lesson'>(
		'lesson'
	)
	const audioRefs = useRef<Record<number, HTMLAudioElement>>({})
	const [videoUrl, setVideoUrl] = useState<string | null>(null)
	const [searchMode, setSearchMode] = useState<'english' | 'hebrew'>('english')
	const [searchQuery, setSearchQuery] = useState('')
	const [showKeyboard, setShowKeyboard] = useState(true)
	const [showImagesOnly, setShowImagesOnly] = useState(false)
	const [showMyStackOnly, setShowMyStackOnly] = useState(false)
	const [cardStatuses, setCardStatuses] = useState<Record<number, CardStatus>>({})
	const { isGuest, ready } = useUserId()
	const canUseSavedWordFeatures = ready && !isGuest

	useEffect(() => {
		if (!canUseSavedWordFeatures) {
			setCardStatuses({})
			setShowMyStackOnly(false)
			return
		}

		let cancelled = false

		const loadStatuses = async () => {
			try {
				const params = new URLSearchParams({
					courseId: String(courseId),
					language: 'he',
				})
				const response = await fetch(`/api/flashcards/status?${params.toString()}`)
				if (!response.ok) throw new Error('Failed to fetch statuses')
				const payload = await response.json()
				if (cancelled) return

				const nextStatuses: Record<number, CardStatus> = {}
				for (const status of payload.statuses ?? []) {
					if (typeof status.cardId !== 'number') continue
					nextStatuses[status.cardId] = {
						isMastered: !!status.isMastered,
						inMyStack: !!status.inMyStack,
					}
				}
				setCardStatuses(nextStatuses)
			} catch (error) {
				console.error('Failed to load dictionary statuses', error)
			}
		}

		loadStatuses()

		return () => {
			cancelled = true
		}
	}, [canUseSavedWordFeatures, courseId])

	function handleKeyPress(char: string) {
		if (char === '\b') {
			setSearchQuery((prev) => prev.slice(0, -1))
		} else {
			setSearchQuery((prev) => prev + char)
		}
	}

	const filteredData = useMemo(() => {
		if (!searchQuery.trim() && !showImagesOnly && !showMyStackOnly) return data

		const query = searchQuery.trim()
		const normalizedQuery = stripHebrewMarks(query)

		let results = data.filter((entry) => {
			if (
				showMyStackOnly &&
				(!entry.id || !cardStatuses[entry.id]?.inMyStack)
			) {
				return false
			}

			if (!searchQuery.trim()) return true

			const heb = stripHebrewMarks(entry.heb)
			const eng = entry.eng?.toLowerCase() ?? ''
			const translit = entry.engTransliteration?.toLowerCase() ?? ''

			if (searchMode === 'english') {
				return (
					eng.includes(query.toLowerCase()) ||
					translit.includes(query.toLowerCase())
				)
			} else {
				return heb.includes(normalizedQuery)
			}
		})

		if (showImagesOnly) {
			results = results.filter((entry) => entry.images?.length > 0)
		}

		return results
	}, [cardStatuses, data, searchQuery, searchMode, showImagesOnly, showMyStackOnly])

	const grouped = useMemo(() => {
		const byLetter: Record<string, HebrewVocab[]> = {}
		for (const letter of hebrewAlphabet) byLetter[letter] = []

		for (const word of filteredData) {
			const base = stripHebrewMarks(word.heb)
			const initial = base[0]
			if (byLetter[initial]) byLetter[initial].push(word)
		}

		for (const letter of hebrewAlphabet) {
			byLetter[letter].sort((a, b) =>
				stripHebrewMarks(a.heb).localeCompare(stripHebrewMarks(b.heb), 'he')
			)
		}

		return byLetter
	}, [filteredData])

	function convertToEmbedUrl(url: string): string {
		try {
			const parsed = new URL(url)
			const videoId = parsed.pathname.split('/').pop()
			const start = parsed.searchParams.get('t')?.replace(/\D/g, '') // extract seconds
			return `https://www.youtube.com/embed/${videoId}?autoplay=1${
				start ? `&start=${start}` : ''
			}`
		} catch {
			return url
		}
	}

	function getLessonRange(num: number): string {
		const start = Math.floor((num - 1) / 10) * 10 + 1
		const end = start + 9
		return `${start}-${end}`
	}

	const groupedByLessonRange = useMemo(() => {
		const byRange: Record<string, Record<number, HebrewVocab[]>> = {}

		for (const word of filteredData) {
			if (!Array.isArray(word.lessons)) continue

			for (const lessonStr of word.lessons) {
				const n = getLessonNumberFromString(lessonStr)
				if (n === null) continue

				const range = getLessonRange(n)
				if (!byRange[range]) byRange[range] = {}
				if (!byRange[range][n]) byRange[range][n] = []

				if (!byRange[range][n].some((w) => w.id === word.id)) {
					byRange[range][n].push(word)
				}
			}
		}

		for (const range in byRange) {
			for (const lesson in byRange[range]) {
				byRange[range][lesson].sort((a, b) =>
					stripHebrewMarks(a.heb).localeCompare(stripHebrewMarks(b.heb), 'he')
				)
			}
		}

		return byRange
	}, [filteredData])

	const lessonRangeProgress = useMemo(() => {
		const progressByRange: Record<
			string,
			{ totalWords: number; masteredWords: number; percent: number }
		> = {}

		for (const [range, lessons] of Object.entries(groupedByLessonRange)) {
			const uniqueEntries = new Map<string, HebrewVocab>()

			for (const words of Object.values(lessons)) {
				for (const word of words) {
					uniqueEntries.set(getEntryProgressKey(word), word)
				}
			}

			const totalWords = uniqueEntries.size
			const masteredWords = Array.from(uniqueEntries.values()).filter(
				(word) => typeof word.id === 'number' && cardStatuses[word.id]?.isMastered
			).length

			progressByRange[range] = {
				totalWords,
				masteredWords,
				percent: totalWords > 0 ? (masteredWords / totalWords) * 100 : 0,
			}
		}

		return progressByRange
	}, [cardStatuses, groupedByLessonRange])

	// Reset expandedId whenever visible lesson groups change
	useEffect(() => {
		setExpandedId(null)
	}, [groupedByLessonRange, sortMode])

	function playAudio(id: number, src: string | undefined) {
		if (!src) return
		const url = toAbsoluteUrl(src)
		if (!audioRefs.current[id]) {
			audioRefs.current[id] = new Audio(url)
		} else {
			// keep src updated if your data can change
			if (audioRefs.current[id].src !== url) {
				audioRefs.current[id].src = url
			}
		}
		audioRefs.current[id].play().catch((err) => {
			console.error('Audio play failed:', err, 'src:', url)
		})
	}

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						const id = entry.target.getAttribute('id')?.replace('letter-', '')
						if (id) setActiveLetter(id)
						break
					}
				}
			},
			{ rootMargin: '-20% 0px -75% 0px' }
		)

		if (sortMode === 'alphabetical') {
			hebrewAlphabet.forEach((letter) => {
				const el = document.getElementById(`letter-${letter}`)
				if (el) observer.observe(el)
			})
		}

		return () => observer.disconnect()
	}, [sortMode])

	function sortLessonRanges(a: string, b: string) {
		const getStart = (r: string) => parseInt(r.split('-')[0], 10)
		return getStart(a) - getStart(b)
	}

	function renderEntry(entry: HebrewVocab) {
		const isMastered = !!(entry.id && cardStatuses[entry.id]?.isMastered)
		const isInMyStack = !!(entry.id && cardStatuses[entry.id]?.inMyStack)
		const wordAccentClass =
			isMastered && isInMyStack
				? 'bg-gradient-to-l from-amber-100 to-emerald-100'
				: isMastered
					? 'bg-amber-100'
					: isInMyStack
						? 'bg-emerald-100'
						: ''

		return (
			<div
				key={entry.id}
				data-entry-id={entry.id}
				className="w-full border rounded bg-white shadow-sm cursor-pointer hover:bg-sky-50"
				onClick={() =>
					setExpandedId((prev) => (prev === entry.id ? null : entry.id))
				}
			>
				<div className="flex items-center justify-between w-full p-1">
					<div className="flex gap-2 items-center w-full">
						{entry.hebAudio && (
							<button
								className="text-xl"
								onClick={(e) => {
									e.stopPropagation()
									playAudio(entry.id ?? 0, entry.hebAudio)
								}}
								aria-label="Play Hebrew audio"
							>
								🔊
							</button>
						)}
						{entry.introduction && (
							<button
								onClick={(e) => {
									e.stopPropagation()
									setVideoUrl(entry.introduction!)
								}}
								className="flex items-center gap-2 text-sky-600 hover:text-sky-800 transition"
								aria-label="Watch Vocabulary"
							>
								<Image
									src={'/icons/iconYoutube.png'}
									alt="YouTube"
									width={24}
									height={24}
									className="inline-block"
								/>
							</button>
						)}
						{entry.images?.length > 0 && (
							<span
								className="flex items-center text-slate-500"
								title="This entry has an image"
								aria-hidden="true"
							>
								<ImageIcon className="h-5 w-5" />
							</span>
						)}
						<div className="mx-auto flex items-center gap-4 sm:gap-6">
							<RootMorphologyIcons
								entry={entry}
								size="compact"
								className="flex gap-1 items-center text-slate-600 sm:hidden"
							/>
							<RootMorphologyIcons
								entry={entry}
								className="hidden gap-1 items-center text-slate-600 sm:flex"
							/>
						</div>
						<div className="ml-auto flex items-center gap-3">
							<div
								className={`rounded-md px-2 py-1 sm:bg-transparent sm:px-0 sm:py-0 ${wordAccentClass}`}
							>
								<div className="flex items-center gap-3">
									<div className="hidden sm:flex items-center gap-2">
										{isInMyStack && (
											<span
												className="rounded-full bg-emerald-100 p-1 text-emerald-600 shadow-sm"
												title="In My Stack"
												aria-label="In My Stack"
											>
												<Bookmark className="h-4 w-4 fill-current" />
											</span>
										)}
										{isMastered && (
											<span
												className="rounded-full bg-amber-100 p-1 text-amber-500 shadow-sm"
												title="Mastered word"
												aria-label="Mastered word"
											>
												<Star className="h-4 w-4 fill-current" />
											</span>
										)}
									</div>
									<span className="text-3xl font-serif">{entry.hebNiqqud}</span>
								</div>
							</div>
						</div>
					</div>
				</div>
				{/* <div
					className={`${
						expandedId === entry.id ? 'block' : 'hidden'
					} px-4 pb-4 pt-2 bg-gray-100 rounded text-left text-sm space-y-1`}
				> */}
				<div
					className={`${
						showImagesOnly || expandedId === entry.id ? 'block' : 'hidden'
					} px-4 pb-4 pt-2 bg-gray-100 rounded text-left text-sm space-y-1`}
				>
					{entry.images?.length > 0 && (
						<Image
							src={toAbsoluteUrl(entry.images[0])}
							alt="Word visual"
							width={200}
							height={200}
							className="object-contain rounded"
						/>
					)}
					<p>
						<strong>Translation:</strong> {entry.eng}
					</p>
					{entry.engDefinition && (
						<p>
							<strong>Definition:</strong> {entry.engDefinition}
						</p>
					)}
					{entry.engTransliteration && (
						<p>
							<strong>Transliteration:</strong> {entry.engTransliteration}
						</p>
					)}
					{entry.ipa && (
						<p>
							<strong>IPA:</strong> {entry.ipa}
						</p>
					)}
					{hasRootMorphology(entry) && (
						<>
							{entry.rootPerson && (
								<p>
									<strong>Root Person:</strong> {entry.rootPerson}
								</p>
							)}
							{entry.rootGender && (
								<p>
									<strong>Root Gender:</strong>{' '}
									{formatRootGenderDisplay(entry.rootGender)}
								</p>
							)}
							{entry.rootNumber && (
								<p>
									<strong>Root Number:</strong> {entry.rootNumber}
								</p>
							)}
						</>
					)}
					{entry.suffixPerson && (
						<p>
							<strong>Suffix Person:</strong> {entry.suffixPerson}
						</p>
					)}
					{entry.suffixGender && (
						<p>
							<strong>Suffix Gender:</strong> {entry.suffixGender}
						</p>
					)}
					{entry.suffixNumber && (
						<p>
							<strong>Suffix Number:</strong> {entry.suffixNumber}
						</p>
					)}
					{Array.isArray(entry.partOfSpeech) &&
						entry.partOfSpeech.length > 0 && (
							<p>
								<strong>Part of Speech:</strong> {entry.partOfSpeech.join(', ')}
							</p>
						)}
					{entry.strongs && (
						<p>
							<strong>Strongs:</strong> {entry.strongs}
						</p>
					)}

					{entry.lessons?.length > 0 && (
						<p>
							<strong>Lesson:</strong>{' '}
							{entry.lessons.map((l) => l.replace(/\D+/g, '')).join(', ')}
						</p>
					)}

					{entry.dictionaryUrl && (
						<p>
							<a
								href={entry.dictionaryUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="text-sky-600 underline"
							>
								View Full Entry on Marble ↗
							</a>
						</p>
					)}
				</div>
			</div>
		)
	}

	useEffect(() => {
		console.log('Lesson ranges:', Object.keys(groupedByLessonRange))
	}, [groupedByLessonRange])

	const scrollToTop = () => {
		window.scrollTo({ top: 0, behavior: 'smooth' })
	}

	// Log broken images
	useEffect(() => {
		data.forEach((entry) => {
			if (entry.images?.[0]) {
				const img = document.createElement('img') // ✅ no TS error
				img.src = toAbsoluteUrl(entry.images[0])
				img.onerror = () => {
					console.warn(
						'❌ Broken image URL:',
						toAbsoluteUrl(entry.images![0]),
						'for',
						entry.heb
					)
				}
			}
		})
	}, [data])

	return (
		<div className="flex w-full md:w-3/4">
			{/* Word List and Sort Options */}
			<div className="flex-grow pr-4">
				{/* Search Bar */}
				<div className="flex flex-col items-center gap-3 mb-4">
					<div className="flex w-full max-w-md gap-2">
						<div className="relative flex-grow">
							<input
								type="text"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder={
									searchMode === 'english'
										? 'Search in English...'
										: 'חפש בעברית...'
								}
								className="w-full border rounded-md px-3 pr-10 py-2 text-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
								dir={searchMode === 'hebrew' ? 'rtl' : 'ltr'}
							/>
							{searchQuery && (
								<button
									type="button"
									onClick={() => setSearchQuery('')}
									className={`absolute ${
										searchMode === 'hebrew' ? 'left-2' : 'right-2'
									} top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xl`}
									aria-label="Clear search"
								>
									✕
								</button>
							)}
						</div>

						<button
							onClick={() =>
								setSearchMode((prev) =>
									prev === 'english' ? 'hebrew' : 'english'
								)
							}
							className="px-3 py-2 border rounded-md bg-sky-100 hover:bg-sky-200 text-sky-700"
						>
							{searchMode === 'english'
								? 'Switch to Hebrew'
								: 'Switch to English'}
						</button>
					</div>

					{searchMode === 'hebrew' && (
						<button
							onClick={() => setShowKeyboard((prev) => !prev)}
							className="text-sky-600 underline text-sm"
						>
							{showKeyboard ? 'Hide Keyboard' : 'Show Keyboard'}
						</button>
					)}
				</div>

				{/* Hebrew Keyboard (toggle) */}
				{showKeyboard && searchMode === 'hebrew' && (
					<div className="mb-4 w-full flex justify-center">
						<HebrewKeyboard
							onKeyPress={handleKeyPress}
							onEnter={() => setShowKeyboard(false)}
						/>
					</div>
				)}
				{/* Sort Toggle */}
				<div className="flex flex-row-reverse flex-wrap justify-center gap-2 mb-4">
					<div className="flex flex-row-reverse flex-wrap justify-center gap-2 mb-4">
						{['alphabetical', 'lesson'].map((mode) => (
							<button
								key={mode}
								onClick={() => setSortMode(mode as 'alphabetical' | 'lesson')}
								className={`px-3 py-1 border rounded-full text-sm font-semibold transition ${
									sortMode === mode
										? 'bg-sky-600 text-white border-sky-600'
										: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
								}`}
							>
								{mode === 'alphabetical' ? 'Alphabetical' : 'By Lesson'}
							</button>
						))}

						{/* Image Filter Button */}
						{canUseSavedWordFeatures && (
							<button
								onClick={() => setShowMyStackOnly((prev) => !prev)}
								className={`px-3 py-1 border rounded-full text-sm font-semibold transition ${
									showMyStackOnly
										? 'bg-amber-500 text-white border-amber-500'
										: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
								}`}
							>
								My Stack
							</button>
						)}
						<button
							onClick={() => setShowImagesOnly((prev) => !prev)}
							className={`px-3 py-1 border rounded-full text-sm font-semibold transition ${
								showImagesOnly
									? 'bg-green-600 text-white border-green-600'
									: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
							}`}
						>
							{showImagesOnly ? 'Hide Images' : 'Show Images'}
						</button>
					</div>
				</div>

				{/* Grouped Display */}
				{sortMode === 'alphabetical' ? (
					<>
						{filteredData.length === 0 && (
							<p className="text-center text-gray-500 my-8">
								No matching words found.
							</p>
						)}
						{hebrewAlphabet.map(
							(letter) =>
								grouped[letter]?.length > 0 && (
									<div
										key={letter}
										id={`letter-${letter}`}
										className="mb-4 scroll-mt-16"
									>
										<h2 className="text-3xl font-cardo text-white text-right pr-4 rounded-md bg-sky-600 my-6">
											{letter}
										</h2>
										<div className="space-y-1">
											{grouped[letter].map(renderEntry)}
										</div>
									</div>
								)
						)}
					</>
				) : (
					<>
						{Object.entries(groupedByLessonRange)
							.sort(([a], [b]) => sortLessonRanges(a, b))
							.map(([range, lessons]) => {
								const sortedLessons = Object.keys(lessons)
									.map(Number)
									.sort((a, b) => a - b)

								return (
									<div
										key={range}
										id={`range-${range}`}
										className="mb-4 scroll-mt-16"
									>
										<h2 className="text-3xl font-bold text-white text-right pr-4 rounded-md bg-sky-600 my-6">
											Lessons {range}
										</h2>
											<div className="mb-4 px-1">
												<div className="mb-2 flex items-center justify-between gap-3 text-sm font-medium text-amber-900">
													<span>Mastered words</span>
													<span>
														{lessonRangeProgress[range]?.masteredWords ?? 0} /{' '}
														{lessonRangeProgress[range]?.totalWords ?? 0}
													</span>
												</div>
												<div className="h-3 w-full overflow-hidden rounded-full bg-amber-100">
													<div
														className="h-full rounded-full bg-amber-500 transition-all"
														style={{
															width: `${lessonRangeProgress[range]?.percent ?? 0}%`,
														}}
													/>
												</div>
											</div>

										{sortedLessons.map((lessonNum) => (
											<div key={lessonNum} className="mb-6">
												<h3 className="text-2xl font-bold text-right pr-4 text-white bg-sky-400 rounded-t-md">
													Lesson {lessonNum}
												</h3>
												<div className="space-y-1 bg-white rounded-b-md shadow">
													{lessons[lessonNum].map(renderEntry)}
												</div>
											</div>
										))}
									</div>
								)
							})}
					</>
				)}
			</div>

			{/* Sidebar Navigation */}
			<div className="w-[70px] sticky top-20 max-h-[80vh] overflow-y-auto text-lg text-center flex flex-col gap-1 flex-shrink-0 scrollbar-thin scrollbar-thumb-sky-400">
				{sortMode === 'alphabetical'
					? hebrewAlphabet.map((letter) => (
							<a
								key={letter}
								href={`#letter-${letter}`}
								className={`px-2 py-1 rounded cursor-pointer font-cardo text-3xl border
									${
										activeLetter === letter
											? 'bg-sky-600 text-white'
											: 'hover:bg-sky-200 text-sky-600'
									}`}
							>
								{letter}
							</a>
					  ))
					: Object.keys(groupedByLessonRange)
							.sort(sortLessonRanges)
							.map((range) => (
								<a
									key={range}
									href={`#range-${range}`}
									className="px-2 py-1 rounded border text-sm font-semibold text-sky-600 hover:bg-sky-100"
								>
									{range}
								</a>
							))}
			</div>
			{videoUrl && (
				<div
					className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
					onClick={() => setVideoUrl(null)}
				>
					<div
						className="relative bg-white rounded-lg shadow-lg w-[90%] max-w-3xl"
						onClick={(e) => e.stopPropagation()}
					>
						<button
							onClick={() => setVideoUrl(null)}
							className="absolute top-2 right-2 text-gray-600 hover:text-black text-2xl"
						>
							✕
						</button>
						<div className="aspect-video w-full rounded-b-lg overflow-hidden">
							<iframe
								src={convertToEmbedUrl(videoUrl)}
								title="YouTube video player"
								className="w-full h-full border-0"
								allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
								allowFullScreen
							></iframe>
						</div>
					</div>
				</div>
			)}

			<button
				onClick={scrollToTop}
				className="fixed bottom-4 right-4 z-50 bg-sky-600 hover:bg-sky-600 text-white px-3 py-2 rounded-full shadow-lg transition"
				aria-label="Scroll to top"
			>
				↑ Top
			</button>
		</div>
	)
}
