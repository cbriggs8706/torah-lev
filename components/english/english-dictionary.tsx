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

// function stripEnglishMarks(text: string): string {
// 	return text.normalize('NFD').replace(/[\u0591-\u05C7]/g, '')
// }

function getLessonNumberFromString(input: string | undefined): number | null {
	if (!input) return null
	const match = input.match(/\d+/) // Finds first number in string
	return match ? parseInt(match[0], 10) : null
}

// function parseGenderPerson(code: string | undefined) {
// 	if (!code) return null
// 	const elements: JSX.Element[] = []
// 	if (code.includes('1'))
// 		elements.push(
// 			<span key="1" className="text-sm font-bold">
// 				1
// 			</span>
// 		)
// 	if (code.includes('2'))
// 		elements.push(
// 			<span key="2" className="text-sm font-bold">
// 				2
// 			</span>
// 		)
// 	if (code.includes('3'))
// 		elements.push(
// 			<span key="3" className="text-sm font-bold">
// 				3
// 			</span>
// 		)
// 	if (code.includes('m'))
// 		elements.push(
// 			// <span
// 			// 	key="m"
// 			// 	className="inline-block w-2 h-2 bg-sky-500 rounded-full"
// 			// ></span>
// 			<span key="m" title="male">
// 				<Image
// 					src={MaleIcon}
// 					alt="male"
// 					width={16}
// 					height={16}
// 					className="inline-block"
// 				/>
// 			</span>
// 		)
// 	if (code.includes('f'))
// 		elements.push(
// 			// <span
// 			// 	key="f"
// 			// 	className="inline-block w-2 h-2 bg-pink-400 rounded-full"
// 			// ></span>
// 			<span key="f" title="female">
// 				<Image
// 					src={FemaleIcon}
// 					alt="female"
// 					width={16}
// 					height={16}
// 					className="inline-block"
// 				/>
// 			</span>
// 		)
// 	if (code.includes('s'))
// 		elements.push(
// 			<span key="s" title="singular">
// 				👤
// 			</span>
// 		)
// 	if (code.includes('p'))
// 		elements.push(
// 			<span key="p" title="plural">
// 				👥
// 			</span>
// 		)
// 	return <div className="flex gap-1 items-center">{elements}</div>
// }

export default function EnglishDictionary({ data }: DictionaryProps) {
	const [expandedId, setExpandedId] = useState<number | null>(null)
	const [activeLetter, setActiveLetter] = useState<string>('א')
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
			// strip diacritics and uppercase
			const norm = first
				.normalize('NFD')
				.replace(/\p{Diacritic}/gu, '') // needs /u flag
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

	const groupedByLessonRange = useMemo(() => {
		const byRange: Record<string, EnglishVocab[]> = {}

		for (const word of data) {
			if (!Array.isArray(word.lessons)) continue

			const validLessonNum = word.lessons
				.map((lesson) => {
					const n = getLessonNumberFromString(lesson)
					if (n === null) console.warn('Unparsed lesson:', lesson)
					return n
				})
				.filter((n): n is number => n !== null)
				.sort((a, b) => b - a)[0]

			if (validLessonNum === undefined) continue

			const range = getLessonRange(validLessonNum)
			if (!byRange[range]) byRange[range] = []
			byRange[range].push(word)
		}

		// Sort inside each range
		// ✅ CORRECT
		for (const range in byRange) {
			byRange[range].sort((a, b) => {
				const aNums =
					a.lessons
						?.map(getLessonNumberFromString)
						.filter((n): n is number => n !== null) ?? []
				const bNums =
					b.lessons
						?.map(getLessonNumberFromString)
						.filter((n): n is number => n !== null) ?? []

				const aMin = Math.min(...aNums)
				const bMin = Math.min(...bNums)

				if (aMin !== bMin) return aMin - bMin
				return a.eng.localeCompare(b.eng, 'he')
			})
		}

		return byRange
	}, [data])

	function playAudio(id: number, src: string | undefined) {
		if (!src) return
		if (!audioRefs.current[id]) {
			audioRefs.current[id] = new Audio(src)
		}
		audioRefs.current[id].play().catch(console.error)
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
			englishAlphabet.forEach((letter) => {
				const el = document.getElementById(`letter-${letter}`)
				if (el) observer.observe(el)
			})
		}

		return () => observer.disconnect()
	}, [sortMode])

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
					<div className="ml-auto flex items-center gap-6">
						{/* {parseGenderPerson(entry.genderPerson)} */}
						<span className="text-xl font-nunito">{entry.eng}</span>
					</div>
					<div className="flex gap-2 items-center w-full">
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
					{/* {entry.genderPerson && (
						<p>
							<strong>Gender/Person:</strong> {entry.genderPerson}
						</p>
					)} */}
					{Array.isArray(entry.partOfSpeech) &&
						entry.partOfSpeech.length > 0 && (
							<p>
								<strong>Part of Speech:</strong> {entry.partOfSpeech.join(', ')}
							</p>
						)}

					{/* {entry.scriptures?.length > 0 && (
						<p>
							<strong>Scriptures:</strong> {entry.scriptures.join('; ')}
						</p>
					)} */}
					{entry.lessons?.length > 0 && (
						<p>
							<strong>Lesson:</strong>{' '}
							{entry.lessons.map((l) => l.slice(3)).join(', ')}
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
									? 'bg-blue-500 text-white border-blue-600'
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
										<h2 className="text-3xl font-bold text-white text-right pr-4 rounded-md bg-sky-500 my-6">
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
						{Object.entries(groupedByLessonRange).map(([range, entries]) => {
							// Group entries by individual lesson number
							const byLesson: Record<number, EnglishVocab[]> = {}
							for (const entry of entries) {
								const num = getLessonNumberFromString(entry.lessons?.[0])
								if (num === null) continue
								if (!byLesson[num]) byLesson[num] = []
								byLesson[num].push(entry)
							}

							const sortedLessons = Object.keys(byLesson)
								.map(Number)
								.sort((a, b) => a - b)

							return (
								<div
									key={range}
									id={`range-${range}`}
									className="mb-4 scroll-mt-16"
								>
									<h2 className="text-3xl font-bold text-white text-right pr-4 rounded-md bg-sky-500 my-6">
										Lessons {range}
									</h2>

									{sortedLessons.map((lessonNum) => (
										<div key={lessonNum} className="mb-6">
											<h3 className="text-2xl font-bold text-right pr-4 text-white bg-sky-400 rounded-t-md">
												Lesson {lessonNum}
											</h3>
											<div className="space-y-1 bg-white rounded-b-md shadow">
												{byLesson[lessonNum].map(renderEntry)}
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
								className={`px-2 py-1 rounded cursor-pointer font-nunito font-bold text-xl border
									${
										activeLetter === letter
											? 'bg-sky-500 text-white'
											: 'hover:bg-sky-200 text-sky-500'
									}`}
							>
								{letter}
							</a>
					  ))
					: Object.keys(groupedByLessonRange)
							.sort((a, b) => parseInt(a) - parseInt(b))
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
			<button
				onClick={scrollToTop}
				className="fixed bottom-4 right-4 z-50 bg-sky-500 hover:bg-sky-600 text-white px-3 py-2 rounded-full shadow-lg transition"
				aria-label="Scroll to top"
			>
				↑ Top
			</button>
		</div>
	)
}
