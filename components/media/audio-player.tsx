'use client'

import React, {
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from 'react'
import {
	Play,
	Pause,
	RotateCcw,
	RotateCw,
	Volume2,
	VolumeX,
	Settings as SettingsIcon,
	Eye,
	EyeOff,
} from 'lucide-react'

// Utils
const clamp = (n: number, min: number, max: number) =>
	Math.max(min, Math.min(max, n))
const formatTime = (t: number) => {
	if (!isFinite(t) || t < 0) t = 0
	const h = Math.floor(t / 3600)
	const m = Math.floor((t % 3600) / 60)
	const s = Math.floor(t % 60)
	const mm = h > 0 ? String(m).padStart(2, '0') : String(m)
	const ss = String(s).padStart(2, '0')
	return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

export type AudioSource = { src: string; type?: string }

export type AudioPlayerProps = {
	src?: string
	sources?: AudioSource[]
	skipSeconds?: number
	defaultVolume?: number
	defaultRate?: number
	startTime?: number
	className?: string
	loop?: boolean
	preload?: 'none' | 'metadata' | 'auto'
	autoPlay?: boolean
	onPlay?: () => void
	onPause?: () => void
	onEnded?: () => void
	onTimeUpdate?: (currentTime: number, duration: number) => void
	onError?: (e: Event) => void
	label?: string
	/** If true, fixes the player to the bottom of the viewport. */
	floating?: boolean
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

// Compact, translucent floating player with hide/show
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
			floating = true,
		},
		ref
	) => {
		const audioRef = useRef<HTMLAudioElement | null>(null)
		const [isPlaying, setIsPlaying] = useState(false)
		const [cur, setCur] = useState(0)
		const [dur, setDur] = useState(0)
		const [vol, setVol] = useState(defaultVolume)
		const [rate, setRate] = useState(defaultRate)
		const [showSettings, setShowSettings] = useState(false)
		const [isHidden, setIsHidden] = useState(false)

		// Stable key for sources
		const sourcesKey = useMemo(() => JSON.stringify(sources ?? []), [sources])

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
				audioRef.current.currentTime = clamp(t, 0, dur || 0)
				setCur(audioRef.current.currentTime)
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

		// Init on source & config changes
		useEffect(() => {
			const el = audioRef.current
			if (!el) return
			setIsPlaying(false)
			el.pause()
			el.load()
			el.currentTime = startTime
			setCur(startTime)
			el.volume = clamp(defaultVolume, 0, 1)
			el.playbackRate = defaultRate
			setVol(clamp(defaultVolume, 0, 1))
			setRate(defaultRate)
			if (autoPlay) {
				el.play()
					.then(() => setIsPlaying(true))
					.catch(() => setIsPlaying(false))
			}
		}, [src, sourcesKey, autoPlay, defaultVolume, defaultRate, startTime])

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

		useEffect(() => {
			if (audioRef.current) audioRef.current.volume = clamp(vol, 0, 1)
		}, [vol])
		useEffect(() => {
			if (audioRef.current) audioRef.current.playbackRate = rate
		}, [rate])

		const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = async (e) => {
			const five = 5
			const k = e.key.toLowerCase()
			if (e.code === 'Space' || k === 'k') {
				e.preventDefault()
				await toggle()
			} else if (k === 'j') nudge(-skipSeconds)
			else if (k === 'l') nudge(skipSeconds)
			else if (e.key === 'ArrowLeft') nudge(-five)
			else if (e.key === 'ArrowRight') nudge(five)
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

		const iconBtn = ({
			onClick,
			label,
			title,
			children,
			caption,
			size = 'md',
		}: {
			onClick: () => void
			label: string
			title?: string
			children: React.ReactNode
			caption?: string
			size?: 'sm' | 'md' | 'lg'
		}) => {
			const dim =
				size === 'lg' ? 'h-12 w-12' : size === 'md' ? 'h-10 w-10' : 'h-9 w-9'
			return (
				<button
					type="button"
					onClick={onClick}
					className={
						`inline-flex flex-col items-center justify-center ${dim} rounded-full border border-white/50 bg-white/70 backdrop-blur-md shadow ` +
						`active:scale-95 transition will-change-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500`
					}
					aria-label={label}
					title={title || label}
				>
					{children}
					{caption && (
						<span className="mt-0.5 text-[10px] leading-none text-neutral-700 select-none">
							{caption}
						</span>
					)}
				</button>
			)
		}

		const volumeIcon =
			vol === 0 ? (
				<VolumeX className="h-5 w-5" />
			) : (
				<Volume2 className="h-5 w-5" />
			)

		// Floating: compact pill anchored bottom-right; otherwise inline block
		const wrapperBase = `w-[min(92vw,28rem)] ${className}`
		const wrapperFloating = `fixed bottom-3 right-3 z-50 rounded-2xl border border-sky-200/40 bg-sky-200/60 backdrop-blur-md shadow-lg p-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]`
		const wrapperInline = `rounded-2xl border border-sky-200/40 bg-sky-200/60 backdrop-blur-md shadow p-3`

		// Hidden tab styles
		const tabBtn = `fixed bottom-3 right-3 z-50 inline-flex items-center gap-2 rounded-full border border-sky-200/40 bg-sky-200/60 backdrop-blur-md shadow px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500`

		if (floating && isHidden) {
			return (
				<button
					type="button"
					className={tabBtn}
					onClick={() => setIsHidden(false)}
					aria-label="Show player"
					title="Show player"
				>
					<Eye className="h-4 w-4" /> Show player
				</button>
			)
		}

		return (
			<div
				className={`${
					floating ? wrapperFloating : wrapperInline
				} ${wrapperBase}`}
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

				{/* Seek */}
				<div className="mb-2 flex items-center gap-2">
					<span className="text-[11px] tabular-nums w-10 text-right text-neutral-700 select-none">
						{formatTime(cur)}
					</span>
					<input
						className="flex-1 appearance-none h-2 rounded-full bg-white/50 cursor-pointer [accent-color:theme(colors.sky.500)] touch-none"
						type="range"
						min={0}
						max={isFinite(dur) && dur > 0 ? dur : 0}
						step={0.1}
						value={Math.min(cur, dur || 0)}
						onChange={(e) => seek(parseFloat(e.target.value))}
						aria-label="Seek"
					/>
					<span className="text-[11px] tabular-nums w-10 text-neutral-700 select-none">
						{formatTime(dur)}
					</span>
				</div>

				{/* Controls */}
				<div className="flex items-center justify-center gap-4">
					{iconBtn({
						onClick: () => nudge(-skipSeconds),
						label: `Back ${skipSeconds} seconds`,
						title: `Back ${skipSeconds}s (J)`,
						size: 'sm',
						caption: `${skipSeconds}s`,
						children: <RotateCcw className="h-5 w-5" aria-hidden />,
					})}

					{iconBtn({
						onClick: toggle,
						label: isPlaying ? 'Pause' : 'Play',
						title: 'Play/Pause (Space, K)',
						size: 'lg',
						children: isPlaying ? (
							<Pause className="h-7 w-7" aria-hidden />
						) : (
							<Play className="h-7 w-7 translate-x-[1px]" aria-hidden />
						),
					})}

					{iconBtn({
						onClick: () => nudge(skipSeconds),
						label: `Forward ${skipSeconds} seconds`,
						title: `Forward ${skipSeconds}s (L)`,
						size: 'sm',
						caption: `${skipSeconds}s`,
						children: <RotateCw className="h-5 w-5" aria-hidden />,
					})}
				</div>

				{/* Settings row */}
				<div className="mt-2 flex items-center justify-between gap-3">
					<button
						type="button"
						className="inline-flex items-center gap-1 rounded-full border border-white/40 bg-white/60 backdrop-blur-md px-2 py-1 text-xs text-neutral-800 shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
						onClick={() => setIsHidden(true)}
						aria-label="Hide player"
						title="Hide player"
					>
						<EyeOff className="h-3.5 w-3.5" /> Hide
					</button>
					{/* Options button only on small screens where it toggles the collapsible settings */}
					<button
						type="button"
						onClick={() => setShowSettings((s) => !s)}
						className="sm:hidden inline-flex items-center gap-1 rounded-full border border-white/40 bg-white/60 backdrop-blur-md px-2 py-1 text-xs text-neutral-800 shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
						aria-expanded={showSettings}
						aria-controls="ap-settings"
					>
						<div className="flex items-center gap-2">
							<SettingsIcon className="h-3.5 w-3.5" /> Options
						</div>
					</button>

					<div className="hidden sm:flex items-center gap-3 ml-auto">
						<label
							className="text-sm text-neutral-800 flex items-center gap-2"
							aria-label="Playback speed"
						>
							<span className="hidden xs:inline">Speed</span>
							<select
								className="border rounded-md px-2 py-1 text-sm bg-white/80 backdrop-blur"
								value={rate}
								onChange={(e) => setRate(parseFloat(e.target.value))}
							>
								<option value={0.5}>0.5×</option>
								<option value={0.75}>0.75×</option>
								<option value={1}>1×</option>
								<option value={1.25}>1.25×</option>
								<option value={1.5}>1.5×</option>
								<option value={2}>2×</option>
							</select>
						</label>

						<label
							className="text-sm text-neutral-800 flex items-center gap-2 select-none"
							aria-label="Volume"
						>
							{volumeIcon}
							<input
								type="range"
								min={0}
								max={1}
								step={0.01}
								value={vol}
								onChange={(e) => setVol(parseFloat(e.target.value))}
								className="h-2 w-24 rounded-full bg-white/50 [accent-color:theme(colors.sky.500)]"
							/>
						</label>
					</div>
				</div>

				{showSettings && (
					<div
						id="ap-settings"
						className="mt-2 grid grid-cols-1 sm:hidden gap-3 rounded-xl border border-white/40 bg-white/60 backdrop-blur-md p-3"
					>
						<label
							className="text-sm text-neutral-800 flex items-center justify-between gap-3"
							aria-label="Playback speed"
						>
							<span>Speed</span>
							<select
								className="border rounded-md px-2 py-1 text-sm bg-white/80 backdrop-blur"
								value={rate}
								onChange={(e) => setRate(parseFloat(e.target.value))}
							>
								<option value={0.5}>0.5×</option>
								<option value={0.75}>0.75×</option>
								<option value={1}>1×</option>
								<option value={1.25}>1.25×</option>
								<option value={1.5}>1.5×</option>
								<option value={2}>2×</option>
							</select>
						</label>

						<label
							className="text-sm text-neutral-800 flex items-center justify-between gap-3"
							aria-label="Volume"
						>
							<span className="flex items-center gap-2">
								{volumeIcon} Volume
							</span>
							<input
								type="range"
								min={0}
								max={1}
								step={0.01}
								value={vol}
								onChange={(e) => setVol(parseFloat(e.target.value))}
								className="h-2 w-36 rounded-full bg-white/50 [accent-color:theme(colors.sky.500)]"
							/>
						</label>
					</div>
				)}
			</div>
		)
	}
)

AudioPlayer.displayName = 'AudioPlayer'

export default AudioPlayer
