'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import ProgressBar from '../progress-bar'
import { phrases } from '@/lib/sentence-builder-phrases'
import { vocab, VocabEntry } from '@/lib/sentence-builder-specifics'
import { useCelebration } from '@/hooks/useCelebration'
import Image from 'next/image'

interface SentenceBuilderProps {
	userId: string
}

export default function SentenceBuilder({ userId }: SentenceBuilderProps) {
	const [currentIndex, setCurrentIndex] = useState(0)
	const [userOrder, setUserOrder] = useState<string[]>([])
	const [showFeedback, setShowFeedback] = useState<null | boolean>(null)
	const [completedCount, setCompletedCount] = useState(0)
	const [finished, setFinished] = useState(false)
	const timerRef = useRef<NodeJS.Timeout | null>(null)
	const { Confetti, celebrate } = useCelebration()
	const [hasAwardedPoints, setHasAwardedPoints] = useState(false)

	// --- shuffle phrases once and pick 5 ---
	const [phrasePool, setPhrasePool] = useState(() =>
		[...phrases].sort(() => Math.random() - 0.5).slice(0, 5)
	)
	const currentPhrase = phrasePool[currentIndex]
	const correctOrder = currentPhrase.hebrew.split(' ')

	// --- Gender colors ---
	function getGenderColor(gender: string) {
		if (gender === 'm') return 'bg-blue-200 border-blue-500'
		if (gender === 'f') return 'bg-pink-200 border-pink-500'
		if (gender === 'mf') return 'bg-purple-200 border-purple-500'
		return 'bg-gray-200 border-gray-500'
	}

	// --- Precompute vocab sections ---
	const { masculineNouns, feminineNouns, adjectives, demonstratives } =
		useMemo(() => {
			const masculineNouns = vocab
				.filter((v) => v.type === 'noun' && v.gender === 'm')
				.sort((a, b) => a.word.localeCompare(b.word, 'he'))

			const feminineNouns = vocab
				.filter((v) => v.type === 'noun' && v.gender === 'f')
				.sort((a, b) => a.word.localeCompare(b.word, 'he'))

			const adjectives = vocab
				.filter((v) => v.type === 'adjective')
				.sort((a, b) => a.word.localeCompare(b.word, 'he'))

			const demonstratives = vocab
				.filter((v) => v.type === 'demonstrative')
				.sort((a, b) => a.word.localeCompare(b.word, 'he'))

			return { masculineNouns, feminineNouns, adjectives, demonstratives }
		}, [])

	// --- Award Points Helper ---
	const awardPoints = useCallback(
		async (points: number) => {
			try {
				await fetch('/api/award-points', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ userId, points }),
				})
			} catch (error) {
				console.error('Failed to award points', error)
			}
		},
		[userId]
	)

	useEffect(() => {
		if (!hasAwardedPoints && completedCount >= 5) {
			setHasAwardedPoints(true)
			setFinished(true)
			celebrate()

			const shofar = new Audio('/shofar.mp3')
			shofar.play().catch(console.error)

			awardPoints(1)
		}
	}, [completedCount, hasAwardedPoints, celebrate, awardPoints])

	// --- Handlers ---
	function handleSelectWord(word: string) {
		setUserOrder((prev) => [...prev, word])
	}

	function handleRemoveWord(index: number) {
		setUserOrder((prev) => prev.filter((_, i) => i !== index))
	}

	function normalizeHebrew(text: string): string {
		return text
			.normalize('NFKC') // normalize presentation forms
			.replace(/[\u0591-\u05BD\u05BF-\u05C7]/g, '') // remove niqqud marks
			.replace(/[שׁשׂ]/g, 'ש') // normalize old presentation forms
			.trim()
	}

	function handleCheck() {
		const joinedUser = userOrder.join(' ')
		const joinedCorrect = correctOrder.join(' ')

		const isCorrect =
			normalizeHebrew(joinedUser) === normalizeHebrew(joinedCorrect)

		setShowFeedback(isCorrect)

		if (isCorrect) {
			setCompletedCount((prev) => prev + 1)

			if (timerRef.current) clearTimeout(timerRef.current)
			timerRef.current = setTimeout(() => {
				goToNext()
			}, 2000)
		}
	}

	function goToNext() {
		if (timerRef.current) clearTimeout(timerRef.current)
		setCurrentIndex((i) => (i + 1) % phrasePool.length)
		setUserOrder([])
		setShowFeedback(null)
	}

	function goToPrevious() {
		if (timerRef.current) clearTimeout(timerRef.current)
		setCurrentIndex((i) => (i - 1 + phrasePool.length) % phrasePool.length)
		setUserOrder([])
		setShowFeedback(null)
	}

	function handleRestart() {
		setHasAwardedPoints(false)
		setFinished(false)
		setCompletedCount(0)
		setShowFeedback(null)
		setUserOrder([])
		setCurrentIndex(0)
		setPhrasePool([...phrases].sort(() => Math.random() - 0.5).slice(0, 5))
	}

	// --- Render section helper ---
	function renderSection(title: string, words: VocabEntry[]) {
		if (words.length === 0) return null
		return (
			<div className="mb-8">
				<h3 className="text-xl font-bold mb-3">{title}</h3>
				<div className="flex flex-wrap justify-center gap-3" dir="rtl">
					{words.map((v) => (
						<button
							key={v.id}
							onClick={() => handleSelectWord(v.word)}
							disabled={userOrder.includes(v.word)}
							className={`px-3 py-2 rounded text-2xl sm:text-3xl md:text-4xl font-times border-2 hover:opacity-80 ${
								userOrder.includes(v.word)
									? 'bg-gray-300 border-gray-400 cursor-not-allowed'
									: getGenderColor(v.gender)
							}`}
						>
							{v.word}
						</button>
					))}
				</div>
			</div>
		)
	}

	// --- Summary Screen ---
	if (finished) {
		return (
			<div className="p-8 max-w-4xl mx-auto text-center">
				{Confetti}
				<h1 className="text-5xl font-bold text-green-700 mb-6">
					You finished all 5 phrases!
					<Image
						src="/icons/iconShofar.png"
						alt="Shofar Celebration"
						width={100}
						height={100}
						className="animate-pulse text-center justify-center mx-auto"
					/>
				</h1>
				<p className="text-2xl mb-6">
					You’ve earned <strong>+1 point</strong>!
				</p>
				<p className="text-lg text-gray-700 mb-8">
					Want to try another round? Click below to reshuffle and continue your
					streak!
				</p>
				<button
					onClick={handleRestart}
					className="px-6 py-3 bg-sky-600 text-white text-2xl rounded hover:bg-sky-700"
				>
					Restart / Reshuffle
				</button>
			</div>
		)
	}

	// --- Main Screen ---
	return (
		<div className="p-4 max-w-5xl mx-auto text-center">
			{Confetti}

			{/* Prompt */}
			<div className="mb-6 p-4 border-2 border-sky-300 bg-sky-50 rounded-xl shadow text-2xl font-bold">
				Target phrase: &apos;{currentPhrase.english}&apos;
			</div>

			{/* Drop area */}
			<div
				className="min-h-[100px] border-2 border-dashed border-gray-400 rounded-lg flex flex-wrap justify-center items-center p-4 mb-6"
				dir="rtl"
			>
				{userOrder.length === 0 ? (
					<span className="text-gray-400 italic">Build the phrase here</span>
				) : (
					userOrder.map((word, idx) => {
						const vocabEntry = vocab.find((v) => v.word === word)
						const color = vocabEntry ? getGenderColor(vocabEntry.gender) : ''
						return (
							<span
								key={idx}
								onClick={() => handleRemoveWord(idx)}
								className={`px-3 py-2 mx-1 my-1 rounded text-2xl sm:text-3xl md:text-4xl font-times cursor-pointer hover:opacity-80 border-2 ${color}`}
							>
								{word}
							</span>
						)
					})
				)}
			</div>

			{/* Controls */}
			<div className="flex justify-center gap-4 mb-4">
				<button
					onClick={goToPrevious}
					className="p-2 px-4 bg-gray-300 hover:bg-gray-400 rounded"
				>
					←
				</button>
				<button
					onClick={handleCheck}
					className="p-2 px-4 bg-green-500 text-white hover:bg-green-600 rounded"
				>
					Check
				</button>
				<button
					onClick={goToNext}
					className="p-2 px-4 bg-gray-300 hover:bg-gray-400 rounded"
				>
					→
				</button>
			</div>

			{/* Progress */}
			<ProgressBar currentIndex={currentIndex} total={phrasePool.length} />

			{/* Feedback */}
			{showFeedback !== null && (
				<p
					className={`text-xl mt-4 font-semibold ${
						showFeedback ? 'text-green-600' : 'text-red-500'
					}`}
				>
					{showFeedback ? (
						<p>Correct!</p>
					) : (
						<p>
							Incorrect. Correct answer:{' '}
							<span className="font-times text-4xl font-medium">
								{correctOrder.join(' ')}
							</span>
						</p>
					)}
				</p>
			)}

			<h3 className="text-2xl font-bold mb-3">Word Bank</h3>

			{/* Word bank sections */}
			{renderSection('Masculine Nouns', masculineNouns)}
			{renderSection('Feminine Nouns', feminineNouns)}
			{renderSection('Adjectives', adjectives)}
			{renderSection('Demonstratives', demonstratives)}
		</div>
	)
}
