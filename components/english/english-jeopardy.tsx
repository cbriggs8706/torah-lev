'use client'

import { useState, useEffect } from 'react'
import ReactConfetti from 'react-confetti'
import { useWindowSize } from 'react-use'

/* ---------------- TYPES ---------------- */

interface Question {
	points: number
	question: string
	answer: string
}

interface Category {
	name: string
	questions: Question[]
}

interface JeopardyGameSet {
	title: string
	categories: Category[]
}

interface JeopardyGameProps {
	data: JeopardyGameSet[]
}

/* ---------------- MAIN COMPONENT ---------------- */

export default function JeopardyGame({ data }: JeopardyGameProps) {
	const [selectedGameIndex, setSelectedGameIndex] = useState<number | null>(
		null
	)
	const [players, setPlayers] = useState<string[]>([])
	const [scores, setScores] = useState<Record<string, number>>({})
	const [revealed, setRevealed] = useState<Record<string, boolean>>({})
	const [completed, setCompleted] = useState<Record<string, boolean>>({})
	const [started, setStarted] = useState(false)
	const [selectedQuestion, setSelectedQuestion] = useState<{
		category: string
		points: number
	} | null>(null)
	const [timeLeft, setTimeLeft] = useState<number | null>(null)
	const [showAnswer, setShowAnswer] = useState(false)
	const [showAwardModal, setShowAwardModal] = useState(false)
	const [gameOver, setGameOver] = useState(false)

	const { width, height } = useWindowSize()
	const activeGame = selectedGameIndex !== null ? data[selectedGameIndex] : null

	const totalQuestions =
		activeGame?.categories.reduce(
			(sum, cat) => sum + cat.questions.length,
			0
		) || 0

	/* ---------------- PLAYER LOGIC ---------------- */

	const addPlayer = (name: string) => {
		if (name.trim() && players.length < 20 && !players.includes(name.trim())) {
			setPlayers((prev) => [...prev, name.trim()])
			setScores((prev) => ({ ...prev, [name.trim()]: 0 }))
		}
	}

	const awardPoints = (player: string, points: number) => {
		setScores((prev) => ({
			...prev,
			[player]: (prev[player] || 0) + points,
		}))
		if (selectedQuestion) {
			const key = `${selectedQuestion.category}-${selectedQuestion.points}`
			setCompleted((prev) => {
				const updated = { ...prev, [key]: true }
				const completedCount = Object.values(updated).filter(Boolean).length
				if (completedCount >= totalQuestions) setGameOver(true)
				return updated
			})
		}
		setSelectedQuestion(null)
		setShowAwardModal(false)
		setShowAnswer(false)
	}

	/* ---------------- QUESTION LOGIC ---------------- */

	const handleQuestionClick = (category: string, points: number) => {
		const key = `${category}-${points}`
		if (completed[key]) return
		setRevealed((prev) => ({ ...prev, [key]: true }))
		setSelectedQuestion({ category, points })
		setTimeLeft(30)
		setShowAnswer(false)
		setShowAwardModal(false)
	}

	useEffect(() => {
		if (timeLeft === null || timeLeft <= 0) return
		const timer = setInterval(() => {
			setTimeLeft((t) => (t && t > 0 ? t - 1 : 0))
		}, 1000)
		return () => clearInterval(timer)
	}, [timeLeft])

	useEffect(() => {
		if (timeLeft === 0 && selectedQuestion) {
			setShowAnswer(true)
			setTimeLeft(null)
		}
	}, [timeLeft, selectedQuestion])

	const endTimerEarly = () => {
		setTimeLeft(0)
	}

	/* ---------------- WINNER LOGIC ---------------- */

	const getWinner = () => {
		if (!players.length) return null
		const sorted = [...players].sort(
			(a, b) => (scores[b] || 0) - (scores[a] || 0)
		)
		const topScore = scores[sorted[0]] || 0
		const winners = sorted.filter((p) => scores[p] === topScore)
		return { winners, topScore }
	}

	/* ---------------- GAME SCREENS ---------------- */

	// 1️⃣ GAME SELECTION
	if (selectedGameIndex === null) {
		return (
			<div className="w-full max-w-xl bg-white shadow rounded-lg p-6 text-center">
				<h2 className="text-2xl font-bold mb-4 text-sky-700">Choose a Game</h2>
				<div className="flex flex-col gap-3">
					{data.map((game, i) => (
						<button
							key={game.title}
							onClick={() => setSelectedGameIndex(i)}
							className="py-3 bg-sky-600 text-white font-bold rounded-lg hover:bg-sky-700"
						>
							{game.title}
						</button>
					))}
				</div>
			</div>
		)
	}

	// 2️⃣ GAME OVER SCREEN
	if (gameOver) {
		const result = getWinner()
		return (
			<div className="relative flex flex-col items-center justify-center w-full h-[80vh] text-center">
				<ReactConfetti width={width} height={height} numberOfPieces={400} />
				<h1 className="text-4xl font-bold text-green-700 mb-6">
					🎉 Game Over! 🎉
				</h1>
				{result && (
					<div>
						{result.winners.length > 1 ? (
							<>
								<p className="text-2xl font-semibold mb-2 text-gray-800">
									It’s a tie between:
								</p>
								<p className="text-3xl text-sky-700 font-bold">
									{result.winners.join(', ')}
								</p>
							</>
						) : (
							<p className="text-3xl text-sky-700 font-bold">
								🏆 {result.winners[0]} wins!
							</p>
						)}
						<p className="mt-3 text-xl text-gray-700">
							Score: {result.topScore} points
						</p>
					</div>
				)}
				<div className="mt-8 flex gap-4">
					<button
						onClick={() => window.location.reload()}
						className="bg-sky-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-sky-700"
					>
						Play Again
					</button>
					<button
						onClick={() => {
							setGameOver(false)
							setStarted(false)
							setSelectedGameIndex(null)
						}}
						className="bg-gray-300 px-6 py-3 rounded-lg font-bold hover:bg-gray-400"
					>
						Main Menu
					</button>
				</div>
			</div>
		)
	}

	// 3️⃣ PLAYER SETUP
	if (!started) {
		return (
			<div className="w-full max-w-xl bg-white shadow rounded-lg p-6">
				<h2 className="text-center text-2xl font-bold mb-4">
					Add Players — {activeGame?.title}
				</h2>
				<p className="text-center mb-4 text-gray-600">
					Add up to 20 players, then click <strong>Start Game</strong>.
				</p>
				<PlayerInput onAdd={addPlayer} />
				<ul className="flex flex-wrap gap-2 justify-center mt-4">
					{players.map((p) => (
						<li
							key={p}
							className="px-3 py-1 bg-sky-100 border rounded text-sky-700 font-semibold"
						>
							{p}
						</li>
					))}
				</ul>
				<button
					onClick={() => setStarted(true)}
					disabled={players.length === 0}
					className="mt-6 w-full py-2 bg-sky-600 text-white rounded-lg font-bold disabled:opacity-50"
				>
					Start Game
				</button>
			</div>
		)
	}

	// 4️⃣ GAME BOARD
	return (
		<div className="w-full flex flex-col items-center justify-start gap-6 p-4 min-h-screen overflow-y-auto lg:overflow-hidden lg:h-screen">
			{/* Scoreboard */}
			<div className="flex flex-wrap justify-center gap-3 w-full max-w-4xl">
				{players.map((p) => (
					<div
						key={p}
						className="bg-sky-100 border border-sky-300 rounded-lg px-4 py-2 text-center"
					>
						<p className="font-bold text-sky-700">{p}</p>
						<p className="text-xl text-gray-800">{scores[p]}</p>
					</div>
				))}
			</div>

			{/* Game Board */}
			<div
				className="
		w-full
		max-w-6xl
		grid
		grid-cols-5
		gap-2
		text-center
		text-white
		font-bold
		h-auto
		lg:h-[70vh]
	"
			>
				{activeGame?.categories.map((cat) => (
					<div
						key={cat.name}
						className="bg-sky-700 py-4 uppercase rounded-t-lg border border-sky-900"
					>
						{cat.name}
					</div>
				))}

				{Array.from({ length: 5 }).map((_, rowIdx) =>
					activeGame?.categories.map((cat) => {
						const q = cat.questions[rowIdx]
						if (!q) return <div key={`${cat.name}-${rowIdx}`} />
						const key = `${cat.name}-${q.points}`
						const isDone = completed[key]

						return (
							<div
								key={key}
								onClick={() => handleQuestionClick(cat.name, q.points)}
								className={`cursor-pointer border border-sky-800 flex items-center justify-center transition rounded-b-lg
	lg:h-[calc(70vh/6)]
	h-28 ${isDone ? 'bg-green-600 text-white' : 'bg-sky-500 hover:bg-sky-400'}`}
							>
								{isDone ? (
									<span className="text-3xl">●</span>
								) : (
									<span className="text-3xl">{q.points}</span>
								)}
							</div>
						)
					})
				)}
			</div>

			{/* Question Modal */}
			{selectedQuestion && (
				<QuestionModal
					selectedQuestion={selectedQuestion}
					data={activeGame}
					timeLeft={timeLeft}
					showAnswer={showAnswer}
					endTimerEarly={endTimerEarly}
					setSelectedQuestion={setSelectedQuestion}
					setTimeLeft={setTimeLeft}
					setShowAnswer={setShowAnswer}
					setShowAwardModal={setShowAwardModal}
				/>
			)}

			{/* Award Points Modal */}
			{showAwardModal && selectedQuestion && (
				<AwardModal
					selectedQuestion={selectedQuestion}
					players={players}
					awardPoints={awardPoints}
					setShowAwardModal={setShowAwardModal}
				/>
			)}
		</div>
	)
}

/* ---------------- SUBCOMPONENTS ---------------- */

function PlayerInput({ onAdd }: { onAdd: (name: string) => void }) {
	const [name, setName] = useState('')
	return (
		<div className="flex gap-2 justify-center">
			<input
				value={name}
				onChange={(e) => setName(e.target.value)}
				placeholder="Enter player name"
				className="border rounded px-3 py-2 w-2/3 text-gray-800"
			/>
			<button
				onClick={() => {
					onAdd(name)
					setName('')
				}}
				className="bg-sky-600 text-white px-4 py-2 rounded font-bold"
			>
				Add
			</button>
		</div>
	)
}

function QuestionModal({
	selectedQuestion,
	data,
	timeLeft,
	showAnswer,
	endTimerEarly,
	setSelectedQuestion,
	setTimeLeft,
	setShowAnswer,
	setShowAwardModal,
}: any) {
	const question = data.categories
		.find((c: any) => c.name === selectedQuestion.category)
		?.questions.find((q: any) => q.points === selectedQuestion.points)

	return (
		<div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
			<div className="relative bg-white p-8 rounded-lg shadow-lg w-[90%] max-w-2xl text-center">
				<h2 className="text-2xl font-bold text-sky-700 mb-6">
					{selectedQuestion.category} for {selectedQuestion.points}
				</h2>

				<p className="text-2xl font-semibold mb-8 text-gray-800">
					{question?.question || '—'}
				</p>

				{/* Countdown Circle */}
				{timeLeft !== null && (
					<div className="relative w-40 h-40 mx-auto mb-6 flex items-center justify-center">
						<svg className="absolute top-0 left-0 w-full h-full">
							<circle
								className="text-gray-300"
								stroke="currentColor"
								strokeWidth="8"
								fill="transparent"
								r="60"
								cx="80"
								cy="80"
							/>
							<circle
								className="text-sky-600"
								stroke="currentColor"
								strokeWidth="8"
								fill="transparent"
								r="60"
								cx="80"
								cy="80"
								strokeDasharray={2 * Math.PI * 60}
								strokeDashoffset={(2 * Math.PI * 60 * (30 - timeLeft)) / 30}
								transform="rotate(-90 80 80)"
							/>
						</svg>
						<span className="text-5xl font-bold text-sky-700">{timeLeft}</span>
					</div>
				)}

				{timeLeft !== null && (
					<button
						onClick={endTimerEarly}
						className="bg-sky-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-sky-700"
					>
						Answer Early
					</button>
				)}

				{showAnswer && (
					<div className="mt-8">
						<p className="text-xl font-medium text-gray-700">
							Answer:{' '}
							<span className="font-semibold text-sky-700">
								{question?.answer || '—'}
							</span>
						</p>
						<button
							onClick={() => setShowAwardModal(true)}
							className="mt-6 bg-green-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-green-700"
						>
							Award Points
						</button>
					</div>
				)}

				<button
					onClick={() => {
						setSelectedQuestion(null)
						setTimeLeft(null)
						setShowAnswer(false)
					}}
					className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl font-bold"
				>
					×
				</button>
			</div>
		</div>
	)
}

function AwardModal({
	selectedQuestion,
	players,
	awardPoints,
	setShowAwardModal,
}: any) {
	return (
		<div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[60]">
			<div className="bg-white p-6 rounded-lg shadow-lg w-80 text-center">
				<h2 className="font-bold text-lg mb-3">Award Points</h2>
				<p className="text-gray-700 mb-4">
					Who answered correctly? ({selectedQuestion.points} pts)
				</p>
				<div className="grid grid-cols-2 gap-2">
					{players.map((p: string) => (
						<button
							key={p}
							onClick={() => awardPoints(p, selectedQuestion.points)}
							className="bg-sky-600 text-white rounded py-2 hover:bg-sky-700"
						>
							{p}
						</button>
					))}
				</div>
				<button
					onClick={() => setShowAwardModal(false)}
					className="mt-4 text-sm text-gray-600 hover:text-gray-800"
				>
					Cancel
				</button>
			</div>
		</div>
	)
}
