'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import ReactConfetti from 'react-confetti'
import { useWindowSize } from 'react-use'

export function useCelebration() {
	const { width, height } = useWindowSize()
	const [showConfetti, setShowConfetti] = useState(false)
	const audioRef = useRef<HTMLAudioElement | null>(null)

	useEffect(() => {
		audioRef.current = new Audio('/shofar.mp3')
	}, [])

	const celebrate = useCallback((options?: { playSound?: boolean }) => {
		setShowConfetti(true)

		if (options?.playSound !== false && audioRef.current) {
			audioRef.current.currentTime = 0 // restart if already played
			audioRef.current.volume = 1 // set volume
			audioRef.current.play().catch((err) => {
				console.warn('Audio playback blocked:', err)
			})
		}

	}, [])

	return {
		Confetti: showConfetti ? (
			<ReactConfetti width={width} height={height} recycle={false} />
		) : null,
		celebrate,
	}
}
