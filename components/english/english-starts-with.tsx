'use client'

import { useState, useEffect } from 'react'
import { useWindowSize } from 'react-use'
import ReactConfetti from 'react-confetti'

/* ---------------- TYPES ---------------- */
interface SWCategory {
	name: string
	examples: string[]
}

interface SWGameSet {
	title: string
	categories: SWCategory[]
}

interface StartsWithProps {
	data: SWGameSet
}

/* ---------------- MAIN COMPONENT ---------------- */
export default function StartsWithGame({ data }: StartsWithProps) {
	const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

	const [players, setPlayers] = useState<string[]>([])
	const [scores, setScores] = useState<Record<string, number>>({})
	const [started, setStarted] = useState(false)

	const [usedLetters, setUsedLetters] = useState<Record<string, boolean>>({})
	const [category, setCategory] = useState<SWCategory | null>(null)

	// ⏱ configurable round duration + current time left
	const [roundDuration, setRoundDuration] = useState<number>(60)
	const [timeLeft, setTimeLeft] = useState<number | null>(null)

	const [showAwardModal, setShowAwardModal] = useState(false)
	const [roundPoints, setRoundPoints] = useState(1)
	const [gameOver, setGameOver] = useState(false)
	const [paused, setPaused] = useState(false)

	const { width, height } = useWindowSize()

	/* ---------------- PLAYER LOGIC ---------------- */
	const addPlayer = (name: string) => {
		const trimmed = name.trim()
		if (!trimmed) return
		if (players.includes(trimmed)) return

		setPlayers((prev) => [...prev, trimmed])

		// NEW: everyone starts at 100, even late joiners
		setScores((prev) => ({ ...prev, [trimmed]: 100 }))
	}

	/* ---------------- GAME LOGIC ---------------- */
	const startRound = () => {
		if (!data.categories.length) return

		const randomCat =
			data.categories[Math.floor(Math.random() * data.categories.length)]

		setCategory(randomCat)
		setUsedLetters({})
		setRoundPoints((prev) => prev + 1) // could be flat if you want
		setTimeLeft(roundDuration)
		setShowAwardModal(false)
	}

	useEffect(() => {
		if (!started || timeLeft === null) return
		if (paused) return // ⏸ paused → timer stops

		if (timeLeft <= 0) {
			setTimeLeft(0)
			setShowAwardModal(true)
			return
		}

		const t = setInterval(() => {
			setTimeLeft((prev) => (prev !== null ? prev - 1 : null))
		}, 1000)

		return () => clearInterval(t)
	}, [timeLeft, started, paused])

	const toggleLetter = (letter: string) => {
		setUsedLetters((prev) => ({
			...prev,
			[letter]: !prev[letter],
		}))
	}

	const getWinner = () => {
		if (!players.length) {
			return { winners: [] as string[], topScore: 0 }
		}

		const sorted = [...players].sort(
			(a, b) => (scores[b] || 0) - (scores[a] || 0)
		)
		const topScore = scores[sorted[0]] || 0
		const winners = sorted.filter((p) => scores[p] === topScore)

		return { winners, topScore }
	}

	const handleEndGame = () => {
		setGameOver(true)
	}

	/* ---------------- GAME SCREENS ---------------- */

	/** 1️⃣ PLAYER SETUP (pre-start) */
	if (!started) {
		return (
			<div className="bg-white p-6 max-w-xl w-full rounded shadow space-y-4">
				<h2 className="text-center text-2xl font-bold">
					Add Players — Starts With
				</h2>

				<PlayerInput onAdd={addPlayer} />

				<ul className="flex flex-wrap gap-2 justify-center mt-2">
					{players.map((p) => (
						<li
							key={p}
							className="px-3 py-1 bg-sky-100 border rounded text-sky-700 font-semibold"
						>
							{p}
						</li>
					))}
				</ul>

				{/* ⏱ Timer duration control (before game starts) */}
				<div className="mt-4">
					<label className="block text-sm font-medium text-gray-700 mb-1">
						Round timer (seconds)
					</label>
					<input
						type="number"
						min={5}
						max={120}
						value={roundDuration}
						onChange={(e) =>
							setRoundDuration(
								Math.min(120, Math.max(5, Number(e.target.value) || 0))
							)
						}
						className="w-full border rounded px-3 py-2"
					/>
					<p className="text-xs text-gray-500 mt-1">
						Each round will start with this many seconds.
					</p>
				</div>

				<button
					disabled={players.length === 0}
					onClick={() => setStarted(true)}
					className="w-full mt-4 py-2 bg-sky-600 text-white rounded font-bold disabled:opacity-50"
				>
					Start Game
				</button>
			</div>
		)
	}

	/** 2️⃣ GAME OVER SCREEN */
	if (gameOver) {
		const w = getWinner()
		return (
			<div className="w-full h-[80vh] flex flex-col justify-center items-center text-center">
				<ReactConfetti width={width} height={height} />

				<h1 className="text-4xl font-bold text-green-700 mb-6">
					🎉 Game Over! 🎉
				</h1>

				{w.winners.length ? (
					<>
						<p className="text-3xl text-sky-700 font-bold">
							🏆 {w.winners.join(', ')} win{w.winners.length > 1 ? '' : 's'}!
						</p>
						<p className="mt-3 text-xl text-gray-700">
							Score: {w.topScore} points
						</p>
					</>
				) : (
					<p className="text-xl text-gray-700">No scores yet this game.</p>
				)}

				<button
					onClick={() => window.location.reload()}
					className="mt-8 bg-sky-600 text-white px-6 py-3 rounded-lg font-bold"
				>
					Play Again
				</button>
			</div>
		)
	}

	/** 3️⃣ MAIN GAME SCREEN */
	/** 3️⃣ MAIN GAME SCREEN */
	return (
		<div className="w-full flex flex-col items-center gap-6 p-4">
			{/* --- TOP CONTROL PANEL --- */}
			<div className="w-full max-w-4xl bg-white border rounded-lg shadow p-4 space-y-4">
				{/* Row 1: Add player + Timer settings */}
				<div className="flex flex-col md:flex-row gap-4">
					{/* Add Player */}
					<div className="flex-1">
						<label className="block text-sm font-semibold text-gray-700 mb-1">
							Add Player
						</label>
						<PlayerInput onAdd={addPlayer} compact />
					</div>

					{/* Timer Input */}
					<div className="flex-1">
						<label className="block text-sm font-semibold text-gray-700 mb-1">
							Round Timer (seconds)
						</label>
						<input
							type="number"
							min={5}
							max={120}
							value={roundDuration}
							onChange={(e) =>
								setRoundDuration(
									Math.min(120, Math.max(5, Number(e.target.value) || 0))
								)
							}
							className="w-full border rounded px-3 py-2 text-gray-800"
						/>
						<p className="text-xs text-gray-500 mt-1">Applies to next round.</p>
					</div>
				</div>

				{/* Row 2: Action Buttons */}
				<div className="flex flex-wrap gap-3 justify-center pt-2">
					{/* Start Round */}
					<button
						onClick={startRound}
						className="bg-sky-600 text-white px-4 py-2 rounded font-bold"
					>
						Start Round
					</button>

					{/* Pause / Resume */}
					{paused ? (
						<button
							onClick={() => setPaused(false)}
							disabled={!category}
							className={`px-4 py-2 rounded font-bold text-white ${
								category
									? 'bg-green-600 hover:bg-green-700'
									: 'bg-gray-400 cursor-not-allowed'
							}`}
						>
							Resume
						</button>
					) : (
						<button
							onClick={() => setPaused(true)}
							disabled={!category}
							className={`px-4 py-2 rounded font-bold text-white ${
								category
									? 'bg-yellow-500 hover:bg-yellow-600'
									: 'bg-gray-400 cursor-not-allowed'
							}`}
						>
							Pause
						</button>
					)}

					{/* Stop Round */}
					<button
						onClick={() => {
							setPaused(false)
							setCategory(null)
							setTimeLeft(null)
							setUsedLetters({})
							setShowAwardModal(false)
						}}
						disabled={!category}
						className={`px-4 py-2 rounded font-bold text-white ${
							category
								? 'bg-red-600 hover:bg-red-700'
								: 'bg-gray-400 cursor-not-allowed'
						}`}
					>
						Stop Round
					</button>

					{/* End Game */}
					<button
						onClick={handleEndGame}
						className="bg-gray-200 text-gray-800 px-4 py-2 rounded font-semibold"
					>
						End Game
					</button>
				</div>

				{/* Unified Timer Display */}
				<div className="text-center pt-2">
					<p className="text-3xl font-bold text-gray-900">
						⏱ {timeLeft ?? '-'}s
					</p>
				</div>
			</div>

			{/* Scoreboard */}
			<div className="flex flex-wrap justify-center gap-3 w-full max-w-4xl">
				{players.map((p) => (
					<div
						key={p}
						className="bg-sky-100 border border-sky-300 rounded-lg px-4 py-2 text-center"
					>
						<p className="font-bold text-sky-700">{p}</p>
						<p className="text-xl text-gray-800">{scores[p] ?? 0}</p>
					</div>
				))}
			</div>

			{/* Category Section */}
			<div className="text-center mt-4 space-y-3">
				{category ? (
					<>
						<h2 className="text-3xl font-bold text-sky-700">{category.name}</h2>
						<p className="text-gray-600">
							Examples: {category.examples.join(', ')}
						</p>
					</>
				) : (
					<p className="text-gray-600">
						Click &ldquo;Start Round&ldquo; to choose a category.
					</p>
				)}
			</div>

			{/* Alphabet Board */}
			<div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-13 gap-4 mt-6">
				{alphabet.map((l) => (
					<button
						key={l}
						onClick={() => toggleLetter(l)}
						className={`px-4 py-3 rounded font-bold text-4xl border transition ${
							usedLetters[l]
								? 'bg-red-500 text-white border-red-600'
								: 'bg-gray-100 text-gray-900 border-gray-300'
						}`}
					>
						{l}
					</button>
				))}
			</div>

			{/* Modal */}
			{showAwardModal && (
				<AwardModal
					players={players}
					points={roundPoints}
					award={(p) => {
						setScores((prev) => ({
							...prev,
							[p]: (prev[p] || 0) - 5,
						}))
						setShowAwardModal(false)
						setCategory(null)
						setTimeLeft(null)
					}}
					onClose={() => setShowAwardModal(false)}
				/>
			)}
		</div>
	)
}

/* ---------------- SUBCOMPONENTS ---------------- */

function PlayerInput({
	onAdd,
	compact,
}: {
	onAdd: (name: string) => void
	compact?: boolean
}) {
	const [value, setValue] = useState('')

	const handleAdd = () => {
		if (!value.trim()) return
		onAdd(value)
		setValue('')
	}

	return (
		<div className={`flex ${compact ? 'gap-1' : 'gap-2'} justify-center`}>
			<input
				value={value}
				onChange={(e) => setValue(e.target.value)}
				placeholder="Player name"
				className="border rounded px-3 py-2 w-2/3"
				onKeyDown={(e) => {
					if (e.key === 'Enter') {
						e.preventDefault()
						handleAdd()
					}
				}}
			/>
			<button
				onClick={handleAdd}
				className="bg-sky-600 text-white px-4 py-2 rounded font-bold"
			>
				Add
			</button>
		</div>
	)
}

function AwardModal({
	players,
	points,
	award,
	onClose,
}: {
	players: string[]
	points: number
	award: (p: string) => void
	onClose: () => void
}) {
	return (
		<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
			<div className="bg-white p-6 rounded shadow w-80 text-center">
				<h2 className="font-bold text-xl mb-3">Choose Player</h2>
				<p className="text-gray-700 mb-4">
					Who loses points this round? (-5 pts)
				</p>

				<div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
					{players.map((p) => (
						<button
							key={p}
							onClick={() => award(p)}
							className="bg-sky-600 text-white py-2 rounded hover:bg-sky-700"
						>
							{p}
						</button>
					))}
				</div>

				<button
					onClick={onClose}
					className="mt-4 text-gray-500 hover:text-gray-700 text-sm"
				>
					Skip / Cancel
				</button>
			</div>
		</div>
	)
}
