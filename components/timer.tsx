'use client'

import { useState, useEffect, useRef } from 'react'
import clsx from 'clsx'

export default function CountdownTimer() {
	const [timeLeft, setTimeLeft] = useState(0)
	const [initialTime, setInitialTime] = useState(0)
	const [running, setRunning] = useState(false)
	const [finished, setFinished] = useState(false)
	const [hasStarted, setHasStarted] = useState(false)
	const [minutesInput, setMinutesInput] = useState('')
	const [secondsInput, setSecondsInput] = useState('')
	const [flash, setFlash] = useState(false)
	const intervalRef = useRef<NodeJS.Timeout | null>(null)

	const presets = [1, 5, 10, 12, 15, 20]

	// Countdown logic
	useEffect(() => {
		if (!running) return

		if (timeLeft <= 0) {
			setRunning(false)
			setFinished(true)
			if (intervalRef.current) clearInterval(intervalRef.current)
			return
		}

		intervalRef.current = setInterval(() => setTimeLeft((t) => t - 1), 1000)

		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current)
		}
	}, [running, timeLeft])

	// Flash last 10 seconds
	useEffect(() => {
		if (timeLeft <= 10 && timeLeft > 0) {
			const flashInterval = setInterval(() => setFlash((f) => !f), 500)
			return () => {
				clearInterval(flashInterval)
			}
		}
		setFlash(false)
	}, [timeLeft])

	const startTimer = () => {
		const mins = parseInt(minutesInput || '0', 10)
		const secs = parseInt(secondsInput || '0', 10)
		const totalSeconds = mins * 60 + secs
		const activeTime = totalSeconds > 0 ? totalSeconds : timeLeft
		if (activeTime > 0) {
			setTimeLeft(activeTime)
			setInitialTime(activeTime)
			setRunning(true)
			setHasStarted(true)
			setFinished(false)
		}
	}

	const stopTimer = () => {
		setRunning(false)
		if (intervalRef.current) clearInterval(intervalRef.current)
	}

	const resetTimer = () => {
		stopTimer()
		setFinished(false)
		setHasStarted(false)
		setTimeLeft(0)
		setMinutesInput('')
		setSecondsInput('')
	}

	const restartSameTime = () => {
		setTimeLeft(initialTime)
		setRunning(true)
		setFinished(false)
	}

	const formatTime = (t: number) => {
		const m = Math.floor(t / 60)
		const s = t % 60
		return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
	}

	// Color logic
	const bgColor = clsx(
		'flex flex-col items-center justify-center text-white transition-colors duration-500 rounded-xl shadow-lg p-8 w-full min-h-[60vh] text-center',
		{
			'bg-sky-600': (timeLeft > 120 || timeLeft === 0) && !finished,
			'bg-green-600': timeLeft <= 120 && timeLeft > 60 && !finished,
			'bg-red-600': timeLeft <= 60 && timeLeft > 0 && !flash && !finished,
			'bg-white text-red-600': timeLeft <= 10 && flash && !finished,
			'bg-black text-white': finished,
		}
	)

	return (
		<div className={bgColor}>
			{/* Setup screen */}
			{!running && !finished && !hasStarted && (
				<div className="space-y-6 w-full">
					<h2 className="text-2xl font-bold">Countdown Timer</h2>

					<div className="flex flex-wrap justify-center gap-2">
						{presets.map((m) => (
							<button
								key={m}
								className="px-4 py-2 bg-black/30 rounded-lg text-lg hover:bg-black/40"
								onClick={() => {
									setTimeLeft(m * 60)
									setMinutesInput(String(m))
									setSecondsInput('0')
								}}
							>
								{m} min
							</button>
						))}
					</div>

					<div className="flex justify-center space-x-2">
						<input
							type="number"
							placeholder="min"
							className="w-20 text-center text-black rounded-lg p-1"
							value={minutesInput}
							onChange={(e) => setMinutesInput(e.target.value)}
						/>
						<input
							type="number"
							placeholder="sec"
							className="w-20 text-center text-black rounded-lg p-1"
							value={secondsInput}
							onChange={(e) => setSecondsInput(e.target.value)}
						/>
					</div>

					<button
						onClick={startTimer}
						className="mt-4 px-6 py-3 bg-black/40 rounded-lg text-xl hover:bg-black/50"
					>
						Start
					</button>

					{timeLeft > 0 && (
						<div>
							<span className="text-[12vw] sm:text-[10vw] md:text-[8vw] font-mono font-bold leading-none block">
								{formatTime(timeLeft)}
							</span>
						</div>
					)}
				</div>
			)}

			{/* Running */}
			{running && (
				<div
					className="flex flex-col items-center justify-center w-full cursor-pointer"
					onClick={stopTimer}
				>
					{/* 👇 Larger digits when running */}
					<span className="text-[20vw] sm:text-[16vw] md:text-[12vw] font-mono font-extrabold leading-none block">
						{formatTime(timeLeft)}
					</span>
					<p className="text-white/80 mt-6 text-2xl font-medium">
						Click to pause
					</p>
				</div>
			)}

			{/* Paused */}
			{!running && hasStarted && !finished && (
				<div className="space-y-4">
					<span className="text-[16vw] sm:text-[12vw] md:text-[10vw] font-mono font-bold block">
						{formatTime(timeLeft)}
					</span>
					<div className="flex justify-center gap-4">
						<button
							onClick={startTimer}
							className="px-4 py-2 bg-black/40 rounded-lg text-lg hover:bg-black/50"
						>
							Resume
						</button>
						<button
							onClick={resetTimer}
							className="px-4 py-2 bg-black/40 rounded-lg text-lg hover:bg-black/50"
						>
							New
						</button>
					</div>
				</div>
			)}

			{/* Finished */}
			{finished && (
				<div className="space-y-6">
					<h1 className="text-[8vw] sm:text-[6vw] md:text-[5vw] font-bold uppercase">
						Time’s Up!
					</h1>
					<div className="flex justify-center gap-4">
						<button
							onClick={restartSameTime}
							className="px-6 py-3 bg-green-600 rounded-lg text-xl hover:bg-green-500"
						>
							Restart
						</button>
						<button
							onClick={resetTimer}
							className="px-6 py-3 bg-sky-600 rounded-lg text-xl hover:bg-sky-500"
						>
							New
						</button>
					</div>
				</div>
			)}
		</div>
	)
}
