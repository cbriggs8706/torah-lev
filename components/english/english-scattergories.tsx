'use client'

import { useEffect, useMemo, useState } from 'react'
import { useWindowSize } from 'react-use'
import ReactConfetti from 'react-confetti'

/* ---------------- TYPES ---------------- */
export interface SGCategory {
	id: string
	name: string
	examples?: string[]
}

export interface SGCategoryGroup {
	name: string
	categories: SGCategory[]
}

export interface SGGameSet {
	title: string
	groups: SGCategoryGroup[]
}

export type SGGameSetList = SGGameSet[]

interface ScattergoriesGameProps {
	data: SGGameSet[]
	categoriesPerRound?: number // default 8
	pointsPerUnique?: number // default 5
}

/* ---------------- MAIN COMPONENT ---------------- */
export default function ScattergoriesGame({
	data,
	categoriesPerRound = 8,
	pointsPerUnique = 5,
}: ScattergoriesGameProps) {
	const [setIndex, setSetIndex] = useState(0)
	const activeSet = useMemo(() => data[setIndex], [data, setIndex])

	const allCategories = useMemo(() => {
		if (!activeSet) return []
		return activeSet.groups.flatMap((g) =>
			g.categories.map((c) => ({
				...c,
				_group: g.name,
			})),
		)
	}, [activeSet])

	const buildChosenCategories = (ids: string[]) => {
		return ids
			.map((id) => allCategories.find((c) => c.id === id))
			.filter(Boolean) as Array<SGCategory & { _group?: string }>
	}

	const [players, setPlayers] = useState<string[]>([])
	const [scores, setScores] = useState<Record<string, number>>({})
	const [started, setStarted] = useState(false)

	// setup selections
	const [roundDuration, setRoundDuration] = useState<number>(60) // committed value
	const [roundDurationText, setRoundDurationText] = useState<string>('60') // what user is typing
	const [selectedIds, setSelectedIds] = useState<string[]>([])

	// round state
	const [roundCategories, setRoundCategories] = useState<
		Array<SGCategory & { _group?: string }>
	>([])
	const [timeLeft, setTimeLeft] = useState<number | null>(null)
	const [paused, setPaused] = useState(false)
	const [gameOver, setGameOver] = useState(false)

	// scoring modal
	const [showScoreModal, setShowScoreModal] = useState(false)

	const LETTER_POOL = [
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
		'R',
		'S',
		'T',
		'W',
	] as const

	const [roundLetter, setRoundLetter] = useState<string | null>(null)

	const pickLetter = () =>
		LETTER_POOL[Math.floor(Math.random() * LETTER_POOL.length)]

	const { width, height } = useWindowSize()

	useEffect(() => {
		setRoundDurationText(String(roundDuration))
	}, [roundDuration])

	const commitRoundDuration = () => {
		const raw = roundDurationText.trim()

		// allow empty -> revert
		if (!raw) {
			setRoundDurationText(String(roundDuration))
			return
		}

		const n = Math.round(Number(raw))
		if (!Number.isFinite(n)) {
			setRoundDurationText(String(roundDuration))
			return
		}

		const clamped = Math.min(300, Math.max(10, n))
		setRoundDuration(clamped)
		setRoundDurationText(String(clamped))
	}

	/* ---------------- PLAYER LOGIC ---------------- */
	const addPlayer = (name: string) => {
		const trimmed = name.trim()
		if (!trimmed) return
		if (players.includes(trimmed)) return

		setPlayers((prev) => [...prev, trimmed])
		setScores((prev) => ({ ...prev, [trimmed]: prev[trimmed] ?? 0 }))
	}

	/* ---------------- SETUP LOGIC ---------------- */
	const toggleCategory = (id: string) => {
		setSelectedIds((prev) => {
			if (prev.includes(id)) return prev.filter((x) => x !== id)
			if (prev.length >= categoriesPerRound) return prev // cap at 8
			return [...prev, id]
		})
	}

	const autoPick = () => {
		const pool = [...allCategories]
		// Fisher-Yates shuffle
		for (let i = pool.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1))
			;[pool[i], pool[j]] = [pool[j], pool[i]]
		}
		setSelectedIds(pool.slice(0, categoriesPerRound).map((c) => c.id))
	}

	/* ---------------- ROUND LOGIC ---------------- */
	const startRound = () => {
		if (players.length === 0) return
		if (selectedIds.length === 0) return

		// categories already displayed; just start the timer
		setPaused(false)
		setTimeLeft(roundDuration)
		setRoundLetter(pickLetter())
		setShowScoreModal(false)
	}

	const stopRound = () => {
		setPaused(false)
		setTimeLeft(null)
		setRoundLetter(null)
		setShowScoreModal(false)
	}

	useEffect(() => {
		if (!started) return
		setRoundCategories(buildChosenCategories(selectedIds))
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedIds, started])

	useEffect(() => {
		if (!started || timeLeft === null) return
		if (paused) return

		if (timeLeft <= 0) {
			setTimeLeft(0)
			setShowScoreModal(true)
			return
		}

		const t = setInterval(() => {
			setTimeLeft((prev) => (prev !== null ? prev - 1 : null))
		}, 1000)

		return () => clearInterval(t)
	}, [timeLeft, started, paused])

	const getWinner = () => {
		if (!players.length) return { winners: [] as string[], topScore: 0 }
		const sorted = [...players].sort(
			(a, b) => (scores[b] || 0) - (scores[a] || 0),
		)
		const topScore = scores[sorted[0]] || 0
		const winners = sorted.filter((p) => scores[p] === topScore)
		return { winners, topScore }
	}

	/* ---------------- SCREENS ---------------- */

	/** 1️⃣ SETUP SCREEN */
	if (!started) {
		const selectedCats = buildChosenCategories(selectedIds)

		return (
			<div className="w-full min-h-screen lg:h-dvh lg:overflow-hidden p-4">
				<div className="w-full h-full grid grid-cols-1 lg:grid-cols-12 gap-4 lg:min-h-0">
					{/* LEFT: Setup */}
					<section
						className="lg:col-span-8 bg-white border rounded-2xl shadow p-4 md:p-6 lg:min-h-0
                            grid grid-rows-[auto_1fr_auto] gap-4"
					>
						{/* Header */}
						<header className="flex items-center justify-between gap-4 pb-4 border-b">
							<h2 className="text-2xl md:text-3xl font-extrabold text-sky-700">
								{activeSet.title}
							</h2>

							<div className="text-right">
								<div className="text-xs md:text-sm text-gray-500 font-semibold">
									Selected
								</div>
								<div className="text-2xl md:text-3xl font-black tabular-nums">
									{selectedIds.length}
									<span className="text-gray-400 text-lg md:text-xl font-extrabold">
										/{categoriesPerRound}
									</span>
								</div>
								<div className="text-[11px] md:text-xs text-gray-500">
									Pick up to {categoriesPerRound}
								</div>
							</div>
						</header>

						{/* Body (fills remaining space on lg) */}
						<div className="min-h-0 flex flex-col gap-4">
							{/* Players */}
							<div className="bg-white border rounded-2xl shadow-sm p-4">
								<div className="flex items-center justify-between mb-3">
									<div className="text-lg md:text-xl font-extrabold text-gray-900">
										Players
									</div>
									<div className="text-sm text-gray-500">
										{players.length} player{players.length === 1 ? '' : 's'}
									</div>
								</div>

								<PlayerInput onAdd={addPlayer} />

								{players.length ? (
									<div className="flex flex-wrap gap-2 justify-center mt-3">
										{players.map((p) => (
											<span
												key={p}
												className="px-3 py-2 rounded-2xl border border-sky-200 bg-sky-50 text-sky-800 font-extrabold"
											>
												{p}
											</span>
										))}
									</div>
								) : (
									<p className="mt-3 text-center text-gray-500">
										Add at least 1 player to start.
									</p>
								)}
							</div>

							{/* Timer + Unit */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="bg-white border rounded-2xl shadow-sm p-4">
									<div className="flex items-center justify-between mb-2">
										<div className="text-lg font-extrabold text-gray-900">
											Round timer
										</div>
										<div className="text-xs text-gray-500">seconds</div>
									</div>

									<input
										type="text"
										inputMode="numeric"
										pattern="[0-9]*"
										value={roundDurationText}
										onChange={(e) =>
											setRoundDurationText(e.target.value.replace(/[^\d]/g, ''))
										}
										onBlur={commitRoundDuration}
										onKeyDown={(e) => {
											if (e.key === 'Enter') {
												e.preventDefault()
												commitRoundDuration()
												;(e.target as HTMLInputElement).blur()
											}
											if (e.key === 'Escape') {
												e.preventDefault()
												setRoundDurationText(String(roundDuration))
												;(e.target as HTMLInputElement).blur()
											}
										}}
										className="w-full border rounded-2xl px-4 py-3 text-xl md:text-2xl font-black tabular-nums text-gray-900"
									/>
									<p className="text-xs text-gray-500 mt-2">
										10–300 seconds. Applies when you start a round.
									</p>
								</div>

								<div className="bg-white border rounded-2xl shadow-sm p-4">
									<div className="text-lg font-extrabold text-gray-900 mb-2">
										Unit
									</div>
									<select
										value={setIndex}
										onChange={(e) => {
											setSetIndex(Number(e.target.value))
											setSelectedIds([])
										}}
										className="w-full border rounded-2xl px-3 py-3 text-lg"
									>
										{data.map((set, i) => (
											<option key={set.title} value={i}>
												{set.title}
											</option>
										))}
									</select>

									<div className="flex gap-2 mt-3">
										<button
											onClick={autoPick}
											className="flex-1 h-12 rounded-2xl bg-gray-100 border text-gray-900 font-extrabold"
										>
											Auto-pick
										</button>
										<button
											onClick={() => setSelectedIds([])}
											className="flex-1 h-12 rounded-2xl bg-gray-100 border text-gray-900 font-extrabold"
										>
											Clear
										</button>
									</div>
								</div>
							</div>

							{/* Selected (small, no scroll) */}
							<div className="bg-white border rounded-2xl shadow-sm p-4">
								<div className="flex items-center justify-between mb-3">
									<div className="text-lg md:text-xl font-extrabold text-gray-900">
										Selected Categories
									</div>
									<div className="text-sm font-semibold text-gray-600">
										{selectedIds.length}/{categoriesPerRound}
									</div>
								</div>

								{selectedCats.length ? (
									<div className="flex flex-wrap gap-2">
										{selectedCats.map((c) => (
											<button
												key={c.id}
												type="button"
												onClick={() => toggleCategory(c.id)} // tap to unselect
												className="px-3 py-2 rounded-2xl border border-sky-200 bg-sky-50 text-sky-900 font-extrabold text-sm
                     active:scale-[0.99]"
												title="Tap to remove"
											>
												{c.name}
											</button>
										))}
									</div>
								) : (
									<p className="text-gray-500">Pick categories on the right.</p>
								)}

								<div className="flex gap-2 mt-3">
									<button
										onClick={autoPick}
										className="flex-1 h-12 rounded-2xl bg-gray-100 border text-gray-900 font-extrabold"
									>
										Auto-pick
									</button>
									<button
										onClick={() => setSelectedIds([])}
										className="flex-1 h-12 rounded-2xl bg-gray-100 border text-gray-900 font-extrabold"
									>
										Clear
									</button>
								</div>
							</div>
						</div>

						{/* Footer button ALWAYS visible */}
						<button
							disabled={players.length === 0 || selectedIds.length === 0}
							onClick={() => {
								setRoundCategories(buildChosenCategories(selectedIds))
								setStarted(true)
							}}
							className="h-16 rounded-2xl bg-sky-600 text-white text-xl font-extrabold disabled:opacity-50"
						>
							Start Game
						</button>
					</section>

					{/* RIGHT: Preview (only on lg) */}
					<aside className="hidden lg:flex lg:col-span-4 lg:min-h-0 flex-col gap-4">
						{/* RIGHT: Category Bank (full height) */}
						<aside className="hidden lg:flex lg:col-span-4 lg:min-h-0 flex-col gap-4">
							<div className="bg-white border rounded-2xl shadow p-4">
								<div className="flex items-center justify-between">
									<div className="text-lg font-extrabold text-gray-900">
										All Categories
									</div>
									<div className="text-sm font-semibold text-gray-600">
										{selectedIds.length}/{categoriesPerRound} selected
									</div>
								</div>
								<div className="text-xs text-gray-500 mt-1">
									Tap to select/unselect. Selected turn blue.
								</div>
							</div>

							<div className="bg-white border rounded-2xl shadow p-4 flex-1 min-h-0">
								{/* Full-height, dense grid */}
								<div className="h-full grid grid-cols-2 2xl:grid-cols-3 gap-2 auto-rows-fr">
									{activeSet.groups.flatMap((g) =>
										g.categories.map((cat) => {
											const checked = selectedIds.includes(cat.id)
											const disabled =
												!checked && selectedIds.length >= categoriesPerRound

											return (
												<button
													key={cat.id}
													onClick={() => toggleCategory(cat.id)}
													disabled={disabled}
													className={`rounded-xl border-2 px-2 py-2 text-left active:scale-[0.99] transition
                ${
									checked
										? 'bg-sky-600 text-white border-sky-700'
										: 'bg-white text-gray-900 border-gray-200 hover:bg-gray-50'
								}
                ${disabled ? 'opacity-35 cursor-not-allowed' : ''}
              `}
												>
													{/* super compact text to fit more */}
													<div className="font-extrabold leading-tight text-[clamp(12px,0.9vw,14px)]">
														{cat.name}
													</div>
													{/* hide examples on the bank so it stays dense */}
												</button>
											)
										}),
									)}
								</div>
							</div>
						</aside>
					</aside>
				</div>
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
	return (
		<div className="h-dvh w-full overflow-hidden">
			<div className="w-full h-full p-4 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4">
				{/* LEFT: Categories (big, always visible) */}
				<section className="lg:col-span-8 min-h-0 bg-white border rounded-2xl shadow p-4 flex flex-col">
					<header className="flex items-center justify-between gap-4 pb-3 border-b">
						<h2 className="text-2xl md:text-3xl font-extrabold text-sky-700">
							{activeSet?.title ?? 'Scattergories'}
						</h2>
						{timeLeft !== null && roundLetter && (
							<div className="mt-2 text-4xl md:text-6xl font-black tracking-widest">
								{roundLetter}
							</div>
						)}
						<div className="text-center">
							<div className="text-3xl md:text-5xl font-black tabular-nums">
								⏱ {timeLeft ?? '-'}s
							</div>

							{paused && (
								<div className="text-sm md:text-base font-semibold text-yellow-600">
									Paused
								</div>
							)}
						</div>
					</header>

					{/* Category grid fills remaining space */}
					<div className="flex-1 min-h-0 pt-4">
						{roundCategories.length ? (
							<div className="h-full grid grid-cols-2 gap-4 auto-rows-fr">
								{roundCategories.map((c) => (
									<button
										key={c.id}
										type="button"
										className="h-full rounded-2xl border-2 border-sky-200 bg-sky-50
  px-4 py-4 text-left active:scale-[0.99]
  flex flex-col justify-center"
									>
										<div className="text-xl md:text-2xl lg:text-3xl font-extrabold text-sky-800 leading-tight">
											{c.name}
										</div>

										{/* optional: show group label small */}
										{'_group' in c && (c as any)._group ? (
											<div className="mt-2 text-sm md:text-base text-gray-600">
												{(c as any)._group}
											</div>
										) : null}
									</button>
								))}
							</div>
						) : (
							<div className="h-full flex items-center justify-center text-gray-500 text-xl">
								Choose categories and start the game.
							</div>
						)}
					</div>
				</section>

				{/* RIGHT: Controls + Scoreboard */}
				<aside
					className="lg:col-span-4 h-full min-h-0 grid gap-4"
					style={{ gridTemplateRows: 'auto auto auto 1fr' }}
				>
					{/* Controls */}
					<div className="bg-white border rounded-2xl shadow p-4">
						<div className="grid grid-cols-2 gap-3">
							<button
								onClick={startRound}
								className="h-14 md:h-16 rounded-2xl bg-sky-600 text-white text-lg md:text-xl font-extrabold"
							>
								Start Round
							</button>

							{paused ? (
								<button
									onClick={() => setPaused(false)}
									disabled={timeLeft === null}
									className={`h-14 md:h-16 rounded-2xl text-lg md:text-xl font-extrabold text-white ${
										timeLeft !== null ? 'bg-green-600' : 'bg-gray-400'
									}`}
								>
									Resume
								</button>
							) : (
								<button
									onClick={() => setPaused(true)}
									disabled={timeLeft === null}
									className={`h-14 md:h-16 rounded-2xl text-lg md:text-xl font-extrabold text-white ${
										timeLeft !== null ? 'bg-yellow-500' : 'bg-gray-400'
									}`}
								>
									Pause
								</button>
							)}

							<button
								onClick={() => {
									setPaused(false)
									setTimeLeft(null)
									setShowScoreModal(false)
								}}
								className="h-14 md:h-16 rounded-2xl bg-red-600 text-white text-lg md:text-xl font-extrabold"
							>
								Stop
							</button>

							<button
								onClick={() => setGameOver(true)}
								className="h-14 md:h-16 rounded-2xl bg-gray-200 text-gray-900 text-lg md:text-xl font-extrabold"
							>
								End Game
							</button>
						</div>
					</div>

					{/* Timer */}
					<div className="bg-white border rounded-2xl shadow p-4">
						<div className="flex items-center justify-between gap-3 mb-2">
							<div className="text-sm font-semibold text-gray-700">
								Round timer (seconds)
							</div>
							<div className="text-xs text-gray-500">Next round</div>
						</div>

						<input
							type="text"
							inputMode="numeric"
							pattern="[0-9]*"
							value={roundDurationText}
							onChange={(e) => {
								const next = e.target.value.replace(/[^\d]/g, '')
								setRoundDurationText(next)
							}}
							onBlur={commitRoundDuration}
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									e.preventDefault()
									commitRoundDuration()
									;(e.target as HTMLInputElement).blur()
								}
								if (e.key === 'Escape') {
									e.preventDefault()
									setRoundDurationText(String(roundDuration))
									;(e.target as HTMLInputElement).blur()
								}
							}}
							className="w-full border rounded-xl px-3 py-3 text-gray-900 text-lg font-semibold"
						/>

						<p className="text-xs text-gray-500 mt-2">
							10–300 seconds. Current round won’t change.
						</p>
					</div>

					{/* Add Player */}
					<div className="bg-white border rounded-2xl shadow p-4">
						<div className="text-sm font-semibold text-gray-700 mb-2">
							Add Player
						</div>
						<PlayerInput onAdd={addPlayer} compact />
					</div>

					{/* Scoreboard (this is the ONLY flexible row) */}
					<div className="bg-white border rounded-2xl shadow p-4 min-h-0 flex flex-col">
						<div className="flex items-center justify-between mb-3">
							<div className="text-lg md:text-xl font-extrabold text-gray-900">
								Scores
							</div>
							<div className="text-sm text-gray-500">
								{players.length} player{players.length === 1 ? '' : 's'}
							</div>
						</div>

						<div className="flex-1 min-h-0 overflow-auto pr-1">
							<div className="grid grid-cols-2 gap-3">
								{players.map((p) => (
									<div
										key={p}
										className="rounded-2xl border border-sky-200 bg-sky-50 px-3 py-3 text-center"
									>
										<div className="font-extrabold text-sky-800 text-base md:text-lg truncate">
											{p}
										</div>
										<div className="text-2xl md:text-3xl font-black tabular-nums">
											{scores[p] ?? 0}
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</aside>

				{showScoreModal && (
					<UniqueScoringModal
						key={`${roundCategories.map((c) => c.id).join('-')}-${players.length}`}
						players={players}
						categories={roundCategories}
						pointsPerUnique={pointsPerUnique}
						onApply={(awardsByCategory) => {
							// awardsByCategory[catId] = set of players to award
							setScores((prev) => {
								const next = { ...prev }
								for (const catId of Object.keys(awardsByCategory)) {
									for (const p of awardsByCategory[catId]) {
										next[p] = (next[p] || 0) + pointsPerUnique
									}
								}
								return next
							})

							setShowScoreModal(false)
							setTimeLeft(null)
							setPaused(false)
						}}
						onClose={() => {
							setShowScoreModal(false)
							setTimeLeft(null)
							setPaused(false)
						}}
					/>
				)}
			</div>
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

function UniqueScoringModal({
	players,
	categories,
	pointsPerUnique,
	onApply,
	onClose,
}: {
	players: string[]
	categories: Array<SGCategory & { _group?: string }>
	pointsPerUnique: number
	onApply: (awardsByCategory: Record<string, Set<string>>) => void
	onClose: () => void
}) {
	const [index, setIndex] = useState(0)

	// catId -> Set(players who were unique)
	const [awards, setAwards] = useState<Record<string, Set<string>>>(() => {
		const init: Record<string, Set<string>> = {}
		for (const c of categories) init[c.id] = new Set()
		return init
	})

	const cat = categories[index]

	const togglePlayer = (player: string) => {
		setAwards((prev) => {
			const next = { ...prev }
			const s = new Set(next[cat.id] ?? [])
			if (s.has(player)) s.delete(player)
			else s.add(player)
			next[cat.id] = s
			return next
		})
	}

	const selectedCount = awards[cat.id]?.size ?? 0
	const isLast = index === categories.length - 1

	return (
		<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3">
			<div className="bg-white w-full max-w-xl rounded-lg shadow-lg overflow-hidden">
				<div className="p-5 border-b">
					<p className="text-xs text-gray-500">
						Category {index + 1} of {categories.length}
					</p>
					<h2 className="text-2xl font-bold text-sky-700">{cat.name}</h2>
					<p className="text-sm text-gray-600 mt-1">
						Tap the players who had a{' '}
						<span className="font-semibold">unique</span> response (+
						{pointsPerUnique} each). Everyone else gets +0.
					</p>
					{cat.examples?.length ? (
						<p className="text-xs text-gray-500 mt-1">
							e.g., {cat.examples.slice(0, 5).join(', ')}
						</p>
					) : null}
				</div>

				<div className="p-5">
					<div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto">
						{players.map((p) => {
							const active = awards[cat.id]?.has(p)
							return (
								<button
									key={p}
									onClick={() => togglePlayer(p)}
									className={`py-2 px-3 rounded border font-semibold transition ${
										active
											? 'bg-green-600 text-white border-green-700'
											: 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
									}`}
								>
									{p}
								</button>
							)
						})}
					</div>

					<p className="text-xs text-gray-500 mt-3">
						Selected unique:{' '}
						<span className="font-semibold">{selectedCount}</span>
					</p>
				</div>

				<div className="p-5 border-t flex items-center justify-between gap-2">
					<button
						onClick={onClose}
						className="text-gray-600 font-semibold hover:text-gray-800"
					>
						Cancel (no points)
					</button>

					<div className="flex items-center gap-2">
						<button
							onClick={() => setIndex((i) => Math.max(0, i - 1))}
							disabled={index === 0}
							className={`px-4 py-2 rounded font-bold ${
								index === 0
									? 'bg-gray-200 text-gray-500'
									: 'bg-gray-100 text-gray-800'
							}`}
						>
							Back
						</button>

						{isLast ? (
							<button
								onClick={() => onApply(awards)}
								className="px-4 py-2 rounded font-bold bg-sky-600 text-white"
							>
								Apply Points
							</button>
						) : (
							<button
								onClick={() =>
									setIndex((i) => Math.min(categories.length - 1, i + 1))
								}
								className="px-4 py-2 rounded font-bold bg-sky-600 text-white"
							>
								Next
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
