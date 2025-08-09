'use client'

import { useState, useEffect, useRef } from 'react'
import { HebrewMusicLine } from '@/db/types'
import { Button } from '../ui/button'
import { useRouter } from 'next/navigation'

const hebrewFonts = [
	{ label: 'Arial', value: 'font-arial' },
	{ label: 'Times', value: 'font-serif' },
	{ label: 'Frank Ruhl Libre', value: 'font-frank' },
	{ label: 'Sans', value: 'font-sans' },
	{ label: 'Tinos', value: 'font-tinos' },
	{ label: 'Nunito', value: 'font-nunito' },
	{ label: 'Cardo', value: 'font-cardo' },
	{ label: 'Rashi', value: 'font-rashi' },
	{ label: 'Suez', value: 'font-suez' },
]

interface MusicLinesTableProps {
	lines: HebrewMusicLine[]
	audio?: string | null
	video?: string | null
}

type DisplayableLine = HebrewMusicLine & {
	displayLineNumbers: number[]
	_group: 0 | 1 | 2
}

export default function MusicLinesTable({
	lines,
	audio,
	video,
}: MusicLinesTableProps) {
	const [showTransliteration, setShowTransliteration] = useState(true)
	const [showEnglish, setShowEnglish] = useState(true)
	const [showNiqqud, setShowNiqqud] = useState(true)
	const [fontClass, setFontClass] = useState('font-serif')
	const [fontSize, setFontSize] = useState(36)
	const [mediaType, setMediaType] = useState<'video' | 'audio'>('video') // Default to audio
	const audioRef = useRef<HTMLAudioElement | null>(null)
	const router = useRouter()

	// ✅ Load preferences on mount
	useEffect(() => {
		const saved = localStorage.getItem('musicTableSettings')
		if (saved) {
			const prefs = JSON.parse(saved)
			setShowTransliteration(prefs.showTransliteration ?? true)
			setShowEnglish(prefs.showEnglish ?? true)
			setShowNiqqud(prefs.showNiqqud ?? true)
			setFontClass(prefs.fontClass ?? 'font-frank')
			setFontSize(prefs.fontSize ?? 24)
		}
	}, [])

	// ✅ Save preferences whenever state changes
	useEffect(() => {
		const prefs = {
			showTransliteration,
			showEnglish,
			showNiqqud,
			fontClass,
			fontSize,
		}
		localStorage.setItem('musicTableSettings', JSON.stringify(prefs))
	}, [showTransliteration, showEnglish, showNiqqud, fontClass, fontSize])

	function playAudio(src?: string | null) {
		if (!src) return // Handles null and undefined
		if (audioRef.current) audioRef.current.pause()

		const audio = new Audio(src)
		audioRef.current = audio
		audio.play().catch(() => {})
	}

	return (
		<div>
			{/* Toggle Buttons */}
			<div className="flex flex-wrap gap-4 mb-4 justify-center">
				<Button onClick={() => setMediaType('video')} disabled={!video}>
					Video
				</Button>
				<Button onClick={() => setMediaType('audio')} disabled={!audio}>
					Audio
				</Button>
				<Button variant={'default'} onClick={() => router.push('/music')}>
					Back to Song List
				</Button>
			</div>
			{/* YouTube (convert youtu.be to embed format) */}
			<div className="flex flex-col gap-4 mb-8">
				{mediaType === 'video' && video && (
					<div className="relative w-full" style={{ paddingTop: '56.25%' }}>
						<iframe
							className="absolute inset-0 w-full h-full rounded-md"
							src={
								video
									.replace('youtu.be/', 'www.youtube.com/embed/')
									.replace('watch?v=', 'embed/')
									.split('?')[0]
							} // strips ?si=... so autoplay works cleanly
							title="YouTube video player"
							frameBorder="0"
							allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
							allowFullScreen
						/>
					</div>
				)}
				{/* Spotify embed */}
				{mediaType === 'audio' && audio && (
					<iframe
						className="w-full rounded-md"
						src={audio.split('?')[0]} // strips utm_source params
						height={152}
						frameBorder="0"
						allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
						loading="lazy"
					/>
				)}
			</div>
			{/* Controls */}
			<div className="flex flex-wrap gap-4 mb-4 justify-center items-center">
				<label className="flex items-center gap-2">
					<input
						type="checkbox"
						checked={showTransliteration}
						onChange={(e) => setShowTransliteration(e.target.checked)}
					/>
					Transliteration
				</label>

				<label className="flex items-center gap-2">
					<input
						type="checkbox"
						checked={showEnglish}
						onChange={(e) => setShowEnglish(e.target.checked)}
					/>
					Translation
				</label>

				<label className="flex items-center gap-2">
					<input
						type="checkbox"
						checked={showNiqqud}
						onChange={(e) => setShowNiqqud(e.target.checked)}
					/>
					Niqqud
				</label>

				<select
					value={fontClass}
					onChange={(e) => setFontClass(e.target.value)}
					className="border p-1 rounded"
				>
					{hebrewFonts.map((font) => (
						<option key={font.value} value={font.value}>
							{font.label}
						</option>
					))}
				</select>

				<button
					onClick={() => setFontSize((s) => s + 2)}
					className="px-2 py-1 border rounded"
				>
					A+
				</button>
				<button
					onClick={() => setFontSize((s) => Math.max(12, s - 2))}
					className="px-2 py-1 border rounded"
				>
					A-
				</button>
			</div>

			{/* Desktop Table */}
			<div className="hidden md:block overflow-x-auto">
				<div className="border border-gray-300 rounded-t-md overflow-hidden">
					<table className="min-w-full border-collapse">
						<thead className="bg-sky-500 text-white">
							<tr>
								<th className="px-4 py-2 text-right">Hebrew</th>
								<th className="px-4 py-2">Line</th>
								{showTransliteration && (
									<th className="px-4 py-2">Transliteration</th>
								)}
								{showEnglish && <th className="px-4 py-2">English</th>}
							</tr>
						</thead>
						<tbody>
							{lines.map((line) => (
								<tr
									key={line.id}
									className="hover:bg-gray-50 border-t border-gray-300"
								>
									<td
										className={`px-4 py-2 text-right ${fontClass}`}
										style={{ fontSize }}
									>
										<div dir="rtl">
											{showNiqqud ? line.hebNiqqud : line.hebText}
										</div>
									</td>

									{/* ✅ Clickable Line Number */}
									<td
										onClick={() => playAudio(line.audioSrc)}
										className={`px-4 py-2 text-center font-bold ${
											line.audioSrc
												? 'cursor-pointer text-sky-600 hover:underline'
												: 'text-gray-400 cursor-default'
										}`}
									>
										{line.lineNumbers?.length
											? line.lineNumbers.join(', ')
											: ''}
									</td>

									{showTransliteration && (
										<td className="px-4 py-2">{line.engTransliteration}</td>
									)}
									{showEnglish && <td className="px-4 py-2">{line.engText}</td>}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
			{/* ✅ Mobile Card Layout */}
			<div className="space-y-4 md:hidden">
				{lines.map((line) => (
					<div
						key={line.id}
						className="border rounded-lg shadow-sm bg-white flex"
					>
						<div className="flex-1 p-3">
							<div
								className={`${fontClass} mb-1`}
								style={{ fontSize }}
								dir="rtl"
							>
								{showNiqqud ? line.hebNiqqud : line.hebText}
							</div>

							{showTransliteration && (
								<div className="text-lg font-semibold mb-1">
									{line.engTransliteration}
								</div>
							)}

							{showEnglish && (
								<div className="text-gray-700">{line.engText}</div>
							)}
						</div>

						{/* ✅ Blue Tab Clickable */}
						<div
							onClick={() => playAudio(line.audioSrc)}
							className={`flex items-center justify-center px-3 text-lg font-bold rounded-r-lg ${
								line.audioSrc
									? 'bg-sky-500 text-white cursor-pointer hover:bg-sky-600 active:scale-95'
									: 'bg-gray-300 text-gray-600 cursor-default'
							}`}
						>
							{line.lineNumbers?.length ? line.lineNumbers.join(', ') : ''}
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
