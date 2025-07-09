'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Flashcard } from '@/lib/vocab'
import Image from 'next/image'

interface DictionaryProps {
	data: Flashcard[]
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

function parseGenderPerson(code: string | undefined) {
	if (!code) return null
	const elements: JSX.Element[] = []
	if (code.includes('1'))
		elements.push(
			<span key="1" className="text-sm font-bold">
				1
			</span>
		)
	if (code.includes('2'))
		elements.push(
			<span key="2" className="text-sm font-bold">
				2
			</span>
		)
	if (code.includes('3'))
		elements.push(
			<span key="3" className="text-sm font-bold">
				3
			</span>
		)
	if (code.includes('m'))
		elements.push(
			<span
				key="m"
				className="inline-block w-2 h-2 bg-sky-500 rounded-full"
			></span>
		)
	if (code.includes('f'))
		elements.push(
			<span
				key="f"
				className="inline-block w-2 h-2 bg-pink-400 rounded-full"
			></span>
		)
	if (code.includes('s'))
		elements.push(
			<span key="s" title="singular">
				👤
			</span>
		)
	if (code.includes('p'))
		elements.push(
			<span key="p" title="plural">
				👥
			</span>
		)
	return <div className="flex gap-1 items-center">{elements}</div>
}

export default function HebrewDictionary({ data }: DictionaryProps) {
	const [expandedId, setExpandedId] = useState<number | null>(null)
	const [activeLetter, setActiveLetter] = useState<string>('א')
	const audioRefs = useRef<Record<number, HTMLAudioElement>>({})

	const grouped = useMemo(() => {
		const byLetter: Record<string, Flashcard[]> = {}
		for (const letter of hebrewAlphabet) {
			byLetter[letter] = []
		}
		for (const word of data) {
			const initial = word.heb[0] || ''
			if (byLetter[initial]) byLetter[initial].push(word)
		}
		return byLetter
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

		hebrewAlphabet.forEach((letter) => {
			const el = document.getElementById(`letter-${letter}`)
			if (el) observer.observe(el)
		})

		return () => observer.disconnect()
	}, [])

	return (
		<div className="flex w-full md:w-3/4">
			{/* Dictionary List */}
			<div className="flex-grow pr-4">
				{hebrewAlphabet.map(
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
									{grouped[letter].map((entry) => (
										<div
											key={entry.id}
											className="w-full border rounded bg-white shadow-sm cursor-pointer hover:bg-sky-50"
											onClick={() =>
												setExpandedId((prev) =>
													prev === entry.id ? null : entry.id
												)
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
													<div className="ml-auto flex items-center gap-6">
														{parseGenderPerson(entry.genderPerson)}
														<span className="text-3xl font-serif">
															{entry.hebNiqqud}
														</span>
													</div>
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
												{entry.engTransliteration && (
													<p>
														<strong>Transliteration:</strong>{' '}
														{entry.engTransliteration}
													</p>
												)}
												{entry.ipa && (
													<p>
														<strong>IPA:</strong> {entry.ipa}
													</p>
												)}
												{entry.genderPerson && (
													<p>
														<strong>Gender/Person:</strong> {entry.genderPerson}
													</p>
												)}
												{Array.isArray(entry.partOfSpeech) &&
													entry.partOfSpeech.length > 0 && (
														<p>
															<strong>Part of Speech:</strong>{' '}
															{entry.partOfSpeech.join(', ')}
														</p>
													)}
												{entry.strongs && (
													<p>
														<strong>Strongs:</strong> {entry.strongs}
													</p>
												)}
												{Array.isArray(entry.scriptures) &&
													entry.scriptures.length > 0 && (
														<p>
															<strong>Scriptures:</strong>{' '}
															{entry.scriptures.join('; ')}
														</p>
													)}
												{entry.lessons && entry.lessons.length > 0 && (
													<p>
														<strong>Lesson:</strong>{' '}
														{entry.lessons.map((l) => l.slice(3)).join(', ')}
													</p>
												)}
												{entry.dictionaryUrl && (
													<p>
														<a
															href={entry.dictionaryUrl}
															target="_blank"
															rel="noopener noreferrer"
															className="text-sky-500 underline"
														>
															View Full Entry on Marble ↗
														</a>
													</p>
												)}
											</div>
										</div>
									))}
								</div>
							</div>
						)
				)}
			</div>

			{/* Sidebar Anchor Links */}
			<div className="w-[50px] sticky top-20 h-fit text-xl text-center flex flex-col gap-1 flex-shrink-0">
				{hebrewAlphabet.map((letter) => (
					<a
						key={letter}
						href={`#letter-${letter}`}
						className={`px-2 py-1 rounded cursor-pointer font-bold border
              ${
								activeLetter === letter
									? 'bg-sky-500 text-white'
									: 'hover:bg-sky-200 text-sky-500'
							}`}
					>
						{letter}
					</a>
				))}
			</div>
		</div>
	)
}
