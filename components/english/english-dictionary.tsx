'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { EnglishVocab } from '@/lib/vocab'
import Image from 'next/image'
import FemaleIcon from '@/public/female-sign-svgrepo-com.svg'
import MaleIcon from '@/public/male-sign-svgrepo-com.svg'

interface DictionaryProps {
	data: EnglishVocab[]
}

const englishAlphabet = [
	'A',
	'B',
	'C',
	'D',
	'E',
	'F',
	'G',
	'H',
	'I',
	'J',
	'K',
	'L',
	'M',
	'N',
	'O',
	'P',
	'Q',
	'R',
	'S',
	'T',
	'U',
	'V',
	'W',
	'X',
	'Y',
	'Z',
	'#',
]

const isFiniteNumber = (n: unknown): n is number =>
	typeof n === 'number' && Number.isFinite(n)

const toNums = (vals: unknown[] | undefined): number[] =>
	(vals ?? [])
		.map((v) => (typeof v === 'string' ? Number(v) : v))
		.filter(isFiniteNumber)

const getFirstLesson = (entry: EnglishVocab): number | null => {
	const nums = toNums(entry.lessons as unknown as unknown[])
	return nums.length ? Math.min(...nums) : null
}

export default function EnglishDictionary({ data }: DictionaryProps) {
	const [expandedId, setExpandedId] = useState<number | null>(null)
	const [activeLetter, setActiveLetter] = useState<string>('A')
	const [activeLesson, setActiveLesson] = useState<number | null>(null)
	const [sortMode, setSortMode] = useState<'alphabetical' | 'lesson'>(
		'alphabetical'
	)

	const audioRefs = useRef<Record<number, HTMLAudioElement>>({})

	const grouped = useMemo(() => {
		const byLetter: Record<string, EnglishVocab[]> = {}
		for (const letter of englishAlphabet) byLetter[letter] = []

		const normalizeInitial = (text: string | undefined): string => {
			if (!text) return '#'
			const first = text.trim().charAt(0)
			if (!first) return '#'
			const norm = first
				.normalize('NFD')
				.replace(/\p{Diacritic}/gu, '')
				.toUpperCase()
			return /[A-Z]/.test(norm) ? norm : '#'
		}

		for (const word of data) {
			const initial = normalizeInitial(word.eng)
			byLetter[initial].push(word)
		}

		for (const letter of englishAlphabet) {
			byLetter[letter].sort((a, b) =>
				a.eng.localeCompare(b.eng, undefined, { sensitivity: 'base' })
			)
		}

		return byLetter
	}, [data])

	function getLessonRange(num: number): string {
		const start = Math.floor((num - 1) / 10) * 10 + 1
		const end = start + 9
		return `${start}-${end}`
	}

	useEffect(() => {
		data.forEach((w) => {
			const nums = (w.lessons ?? []).map((v) =>
				typeof v === 'string' ? Number(v) : v
			)
			if (nums.some((n) => !Number.isFinite(n))) {
				console.warn('Bad lessons for', w.eng, w.lessons)
			}
		})
	}, [data])

	const groupedByLessonRange = useMemo(() => {
		const byRange: Record<string, EnglishVocab[]> = {}
		for (const word of data) {
			const first = getFirstLesson(word)
			if (first == null) continue
			const range = getLessonRange(first)
			;(byRange[range] ??= []).push(word)
		}

		for (const range in byRange) {
			byRange[range].sort((a, b) => {
				const fa = getFirstLesson(a) ?? Infinity
				const fb = getFirstLesson(b) ?? Infinity
				if (fa !== fb) return fa - fb
				return a.eng.localeCompare(b.eng, undefined, { sensitivity: 'base' })
			})
		}

		return byRange
	}, [data])

	// Flat list of all first-appearance lesson numbers for sidebar buttons
	const allFirstLessons = useMemo(() => {
		const set = new Set<number>()
		for (const entry of data) {
			const n = getFirstLesson(entry)
			if (isFiniteNumber(n)) set.add(n)
		}
		return Array.from(set).sort((a, b) => a - b)
	}, [data])

	function playAudio(id: number, src: string | undefined) {
		if (!src) return
		if (!audioRefs.current[id]) {
			audioRefs.current[id] = new Audio(src)
		}
		audioRefs.current[id].play().catch(console.error)
	}

	// Observe ALPHABET sections to set active letter (sky button highlight)
	useEffect(() => {
		if (sortMode !== 'alphabetical') return
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

		englishAlphabet.forEach((letter) => {
			const el = document.getElementById(`letter-${letter}`)
			if (el) observer.observe(el)
		})

		return () => observer.disconnect()
	}, [sortMode])

	// Observe LESSON sections to set active lesson (sky button highlight)
	useEffect(() => {
		if (sortMode !== 'lesson') return
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						const raw = entry.target.getAttribute('id')?.replace('lesson-', '')
						const n = raw ? Number(raw) : NaN
						if (Number.isFinite(n)) setActiveLesson(n)
						break
					}
				}
			},
			{ rootMargin: '-20% 0px -75% 0px' }
		)

		allFirstLessons.forEach((n) => {
			const el = document.getElementById(`lesson-${n}`)
			if (el) observer.observe(el)
		})

		return () => observer.disconnect()
	}, [sortMode, allFirstLessons])

	function renderEntry(entry: EnglishVocab) {
		return (
			<div
				key={entry.id}
				className="w-full border rounded bg-white shadow-sm cursor-pointer hover:bg-sky-50"
				onClick={() =>
					setExpandedId((prev) => (prev === entry.id ? null : entry.id))
				}
			>
				<div className="flex items-center justify-between w-full p-1">
					<span className="text-xl font-nunito">{entry.eng}</span>
					{entry.engAudio && (
						<button
							className="text-xl"
							onClick={(e) => {
								e.stopPropagation()
								playAudio(entry.id ?? 0, entry.engAudio)
							}}
							aria-label="Play English audio"
						>
							🔊
						</button>
					)}
				</div>
				<div
					className={`${
						expandedId === entry.id ? 'block' : 'hidden'
					} px-4 pb-4 pt-2 bg-gray-100 rounded text-left text-sm space-y-1`}
				>
					{entry.images?.length > 0 && (
						<Image
							src={entry.images[0]}
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
					{entry.spa && (
						<p>
							<strong>Spanish Translation:</strong> {entry.spa}
						</p>
					)}
					{entry.spaTransliteration && (
						<p>
							<strong>Spanish Transliteration:</strong>{' '}
							{entry.spaTransliteration}
						</p>
					)}
					{entry.por && (
						<p>
							<strong>Portuguese Translation:</strong> {entry.por}
						</p>
					)}
					{entry.porTransliteration && (
						<p>
							<strong>Portuguese Transliteration:</strong>{' '}
							{entry.porTransliteration}
						</p>
					)}
					{entry.ipa && (
						<p>
							<strong>IPA:</strong> {entry.ipa}
						</p>
					)}
					{Array.isArray(entry.partOfSpeech) &&
						entry.partOfSpeech.length > 0 && (
							<p>
								<strong>Part of Speech:</strong> {entry.partOfSpeech.join(', ')}
							</p>
						)}
					{entry.lessons?.length > 0 && (
						<p>
							<strong>First lesson:</strong> {getFirstLesson(entry) ?? '—'}
						</p>
					)}
				</div>
			</div>
		)
	}

	useEffect(() => {
		data.forEach((entry) => {
			if (entry.images?.[0]) {
				const img = document.createElement('img')
				img.src = entry.images[0]
				img.onerror = () => {
					console.warn(
						'❌ Broken image URL:',
						entry.images![0],
						'for',
						entry.eng
					)
				}
			}
		})
	}, [data])

	const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

	// Shared button classes for alphabet + lesson buttons
	const getSideBtnClass = (active: boolean) =>
		`px-2 py-1 rounded cursor-pointer font-nunito font-bold text-xl border ${
			active ? 'bg-sky-600 text-white' : 'hover:bg-sky-200 text-sky-600'
		}`

	return (
		<div className="flex w-full md:w-3/4">
			{/* Word List and Sort Options */}
			<div className="flex-grow pr-4">
				{/* Sort Toggle */}
				<div className="flex flex-wrap justify-center gap-2 mb-4">
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
							{mode === 'alphabetical' ? 'Alphabetical' : 'Lesson'}
						</button>
					))}
				</div>

				{/* Grouped Display */}
				{sortMode === 'alphabetical' ? (
					<>
						{englishAlphabet.map(
							(letter) =>
								grouped[letter]?.length > 0 && (
									<div
										key={letter}
										id={`letter-${letter}`}
										className="mb-4 scroll-mt-16"
									>
										<h2 className="text-3xl font-bold text-white text-right pr-4 rounded-md bg-sky-600 my-6">
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
							.sort(
								([a], [b]) => Number(a.split('-')[0]) - Number(b.split('-')[0])
							)
							.map(([range, entries]) => {
								const byLesson: Record<number, EnglishVocab[]> = {}

								for (const entry of entries) {
									const first = getFirstLesson(entry)
									if (first == null) continue
									;(byLesson[first] ??= []).push(entry)
								}

								const sortedLessons = Object.keys(byLesson)
									.map(Number)
									.sort((a, b) => a - b)

								return (
									<div key={range} id={`range-${range}`} className="mb-4">
										{/* keep range header if you like; optional */}
										<h2 className="sr-only">Lessons {range}</h2>

										{sortedLessons.map((lessonNum) => (
											<div
												key={lessonNum}
												id={`lesson-${lessonNum}`}
												className="mb-6 scroll-mt-16"
											>
												<h3 className="text-2xl font-bold text-right pr-4 text-white bg-sky-400 rounded-t-md my-6">
													Lesson {lessonNum}
												</h3>
												<div className="space-y-1 bg-white rounded-b-md shadow">
													{(byLesson[lessonNum] ?? []).map(renderEntry)}
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
			<div className="w-[70px] sticky top-20 max-h-[80vh] overflow-y-auto text-lg text-center flex flex-col gap-2 flex-shrink-0 scrollbar-thin scrollbar-thumb-sky-400">
				{sortMode === 'alphabetical'
					? englishAlphabet.map((letter) => (
							<a
								key={letter}
								href={`#letter-${letter}`}
								className={getSideBtnClass(activeLetter === letter)}
							>
								{letter}
							</a>
					  ))
					: allFirstLessons.map((lessonNum) => (
							<a
								key={lessonNum}
								href={`#lesson-${lessonNum}`}
								className={getSideBtnClass(activeLesson === lessonNum)}
								aria-label={`Jump to lesson ${lessonNum}`}
							>
								{lessonNum}
							</a>
					  ))}
			</div>

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
