'use client'

import React, { useEffect, useImperativeHandle, useRef, useState } from 'react'
import { formatTime } from './audio-utils'

export type AudioSource = { src: string; type?: string }

export type AudioPlayerProps = {
	/** Single src or a list of <source> entries */
	src?: string
	sources?: AudioSource[]
	/** Skip amount in seconds (used by ± buttons & keyboard) */
	skipSeconds?: number
	/** Initial volume (0–1) */
	defaultVolume?: number
	/** Initial playback rate */
	defaultRate?: number
	/** Start position (seconds) */
	startTime?: number
	/** Tailwind / custom classes */
	className?: string
	/** Standard HTMLAudioElement props (subset) */
	loop?: boolean
	preload?: 'none' | 'metadata' | 'auto'
	autoPlay?: boolean
	/** Events */
	onPlay?: () => void
	onPause?: () => void
	onEnded?: () => void
	onTimeUpdate?: (currentTime: number, duration: number) => void
	onError?: (e: Event) => void
	/** Optional label for accessibility */
	label?: string
}

export type AudioPlayerHandle = {
	play: () => Promise<void>
	pause: () => void
	toggle: () => Promise<void>
	seekTo: (seconds: number) => void
	nudge: (deltaSeconds: number) => void
	setRate: (rate: number) => void
	setVolume: (vol: number) => void
	getCurrentTime: () => number
	getDuration: () => number
}

/**
 * Reusable audio player with Play/Pause, ±skip, seekbar, speed, volume, and keyboard shortcuts.
 * Keyboard: Space = toggle, J = -skip, L = +skip, K = toggle, ArrowLeft/Right = ±5s.
 */
const AudioPlayer = React.forwardRef<AudioPlayerHandle, AudioPlayerProps>(
	(
		{
			src,
			sources,
			skipSeconds = 10,
			defaultVolume = 1,
			defaultRate = 1,
			startTime = 0,
			className = '',
			loop,
			preload = 'metadata',
			autoPlay,
			onPlay,
			onPause,
			onEnded,
			onTimeUpdate,
			onError,
			label = 'Audio player',
		},
		ref
	) => {
		const audioRef = useRef<HTMLAudioElement | null>(null)
		const [isPlaying, setIsPlaying] = useState(false)
		const [cur, setCur] = useState(0)
		const [dur, setDur] = useState(0)
		const [vol, setVol] = useState(defaultVolume)
		const [rate, setRate] = useState(defaultRate)

		// Expose imperative API
		useImperativeHandle(ref, () => ({
			async play() {
				if (!audioRef.current) return
				await audioRef.current.play()
				setIsPlaying(true)
			},
			pause() {
				audioRef.current?.pause()
				setIsPlaying(false)
			},
			async toggle() {
				if (!audioRef.current) return
				if (audioRef.current.paused) {
					await audioRef.current.play()
					setIsPlaying(true)
				} else {
					audioRef.current.pause()
					setIsPlaying(false)
				}
			},
			seekTo(seconds: number) {
				if (!audioRef.current) return
				audioRef.current.currentTime = clamp(seconds, 0, dur || 0)
				setCur(audioRef.current.currentTime)
			},
			nudge(delta: number) {
				if (!audioRef.current) return
				const t = (audioRef.current.currentTime || 0) + delta
				this.seekTo(t)
			},
			setRate(r: number) {
				setRate(r)
				if (audioRef.current) audioRef.current.playbackRate = r
			},
			setVolume(v: number) {
				setVol(v)
				if (audioRef.current) audioRef.current.volume = clamp(v, 0, 1)
			},
			getCurrentTime() {
				return audioRef.current?.currentTime ?? 0
			},
			getDuration() {
				return audioRef.current?.duration ?? 0
			},
		}))

		// Initialize & react to source changes
		useEffect(() => {
			const el = audioRef.current
			if (!el) return
			setIsPlaying(false)
			el.pause()
			el.load()
			el.currentTime = startTime
			setCur(startTime)
			// ensure settings
			el.volume = clamp(defaultVolume, 0, 1)
			el.playbackRate = defaultRate
			setVol(clamp(defaultVolume, 0, 1))
			setRate(defaultRate)
			// autoplay if requested
			if (autoPlay) {
				el.play()
					.then(() => setIsPlaying(true))
					.catch(() => setIsPlaying(false))
			}
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [src, JSON.stringify(sources)])

		// Wire events
		useEffect(() => {
			const el = audioRef.current
			if (!el) return
			const onLoaded = () => setDur(el.duration || 0)
			const onTime = () => {
				const t = el.currentTime || 0
				setCur(t)
				onTimeUpdate?.(t, el.duration || 0)
			}
			const onEndedLocal = () => {
				setIsPlaying(false)
				onEnded?.()
			}
			const onPlayLocal = () => {
				setIsPlaying(true)
				onPlay?.()
			}
			const onPauseLocal = () => {
				setIsPlaying(false)
				onPause?.()
			}
			const onErrorLocal = (e: Event) => onError?.(e)

			el.addEventListener('loadedmetadata', onLoaded)
			el.addEventListener('timeupdate', onTime)
			el.addEventListener('ended', onEndedLocal)
			el.addEventListener('play', onPlayLocal)
			el.addEventListener('pause', onPauseLocal)
			el.addEventListener('error', onErrorLocal)

			return () => {
				el.removeEventListener('loadedmetadata', onLoaded)
				el.removeEventListener('timeupdate', onTime)
				el.removeEventListener('ended', onEndedLocal)
				el.removeEventListener('play', onPlayLocal)
				el.removeEventListener('pause', onPauseLocal)
				el.removeEventListener('error', onErrorLocal)
			}
		}, [onEnded, onPause, onPlay, onTimeUpdate, onError])

		// Keep volume/rate synced
		useEffect(() => {
			if (audioRef.current) audioRef.current.volume = clamp(vol, 0, 1)
		}, [vol])
		useEffect(() => {
			if (audioRef.current) audioRef.current.playbackRate = rate
		}, [rate])

		// Keyboard shortcuts (only when focused)
		const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = async (e) => {
			const five = 5
			if (e.code === 'Space' || e.key.toLowerCase() === 'k') {
				e.preventDefault()
				await toggle()
			} else if (e.key.toLowerCase() === 'j') {
				nudge(-skipSeconds)
			} else if (e.key.toLowerCase() === 'l') {
				nudge(skipSeconds)
			} else if (e.key === 'ArrowLeft') {
				nudge(-five)
			} else if (e.key === 'ArrowRight') {
				nudge(five)
			}
		}

		const toggle = async () => {
			if (!audioRef.current) return
			if (isPlaying) {
				audioRef.current.pause()
				setIsPlaying(false)
			} else {
				try {
					await audioRef.current.play()
					setIsPlaying(true)
				} catch {
					setIsPlaying(false)
				}
			}
		}

		const seek = (t: number) => {
			if (!audioRef.current) return
			const clamped = clamp(t, 0, dur || 0)
			audioRef.current.currentTime = clamped
			setCur(clamped)
		}

		const nudge = (delta: number) => seek(cur + delta)

		return (
			<div
				className={`w-full rounded-md border p-3 shadow-sm bg-white focus:outline-none focus:ring ring-offset-2 ring-blue-300 ${className}`}
				role="group"
				aria-label={label}
				tabIndex={0}
				onKeyDown={onKeyDown}
			>
				<audio ref={audioRef} loop={loop} preload={preload}>
					{sources?.length ? (
						sources.map((s, i) => <source key={i} src={s.src} type={s.type} />)
					) : src ? (
						<source src={src} />
					) : null}
					Your browser does not support the audio element.
				</audio>

				{/* Controls */}
				<div className="flex flex-wrap items-center gap-2">
					<button
						type="button"
						onClick={() => nudge(-skipSeconds)}
						className="px-2 py-1 border rounded text-sm"
						aria-label={`Back ${skipSeconds} seconds`}
						title={`Back ${skipSeconds}s (J)`}
					>
						⏪ {skipSeconds}s
					</button>

					<button
						type="button"
						onClick={toggle}
						className="px-3 py-1 border rounded text-sm"
						aria-label={isPlaying ? 'Pause' : 'Play'}
						title="Play/Pause (Space or K)"
					>
						{isPlaying ? '⏸️ Pause' : '▶️ Play'}
					</button>

					<button
						type="button"
						onClick={() => nudge(skipSeconds)}
						className="px-2 py-1 border rounded text-sm"
						aria-label={`Forward ${skipSeconds} seconds`}
						title={`Forward ${skipSeconds}s (L)`}
					>
						{skipSeconds}s ⏩
					</button>

					<div className="ml-auto flex items-center gap-3">
						<label className="text-sm">
							Speed{' '}
							<select
								className="border rounded px-1 py-0.5"
								value={rate}
								onChange={(e) => setRate(parseFloat(e.target.value))}
								aria-label="Playback speed"
							>
								<option value={0.75}>0.75×</option>
								<option value={1}>1×</option>
								<option value={1.25}>1.25×</option>
								<option value={1.5}>1.5×</option>
								<option value={2}>2×</option>
							</select>
						</label>

						<label
							className="text-sm flex items-center gap-2"
							aria-label="Volume"
						>
							Vol
							<input
								type="range"
								min={0}
								max={1}
								step={0.01}
								value={vol}
								onChange={(e) => setVol(parseFloat(e.target.value))}
							/>
						</label>
					</div>
				</div>

				{/* Seek bar */}
				<div className="mt-2 flex items-center gap-2">
					<span className="text-xs tabular-nums w-10 text-right">
						{formatTime(cur)}
					</span>
					<input
						className="flex-1"
						type="range"
						min={0}
						max={isFinite(dur) && dur > 0 ? dur : 0}
						step={0.1}
						value={Math.min(cur, dur || 0)}
						onChange={(e) => seek(parseFloat(e.target.value))}
						aria-label="Seek"
					/>
					<span className="text-xs tabular-nums w-10">{formatTime(dur)}</span>
				</div>
			</div>
		)
	}
)

AudioPlayer.displayName = 'AudioPlayer'

export default AudioPlayer

function clamp(n: number, min: number, max: number) {
	return Math.max(min, Math.min(max, n))
}
