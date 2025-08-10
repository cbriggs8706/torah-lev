'use client'

import { useState, useEffect, useRef } from 'react'
import { HebrewPrayerLine } from '@/db/types'
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

interface PrayerLinesTableProps {
	lines: HebrewPrayerLine[]
	prayerId: number
}

type DisplayableLine = HebrewPrayerLine & {
	displayLineNumbers: number[]
	_group: 0 | 1 | 2
}

export default function PrayerLinesTable({
	lines,
	prayerId,
}: PrayerLinesTableProps) {
	const [showTransliteration, setShowTransliteration] = useState(true)
	const [showEnglish, setShowEnglish] = useState(true)
	const [showNiqqud, setShowNiqqud] = useState(true)
	const [fontClass, setFontClass] = useState('font-serif')
	const [fontSize, setFontSize] = useState(36)
	const audioRef = useRef<HTMLAudioElement | null>(null)
	const router = useRouter()

	// Compute the smallest raw line number across all DB lines
	const allRaw = (lines ?? []).flatMap((l) => l.lineNumbers ?? [])
	const minRaw = allRaw.length ? Math.min(...allRaw) : Infinity

	// We want the first DB line to display as 3 (after fixed 1 & 2)
	const desiredFirstDb = 3
	const offset = Number.isFinite(minRaw) ? desiredFirstDb - minRaw : 0

	// Map DB lines using the dynamic offset
	const dbLines: DisplayableLine[] = (lines ?? []).map((l) => ({
		...l,
		displayLineNumbers: (l.lineNumbers ?? []).map((n) => n + offset),
		_group: 1,
	}))

	// Then compute maxDbDisplay from the *display* numbers as you already do
	const maxDbDisplay = dbLines.length
		? Math.max(
				...dbLines.flatMap((l) =>
					l.displayLineNumbers.length ? l.displayLineNumbers : [2]
				)
		  )
		: 2

	const fixedStart: DisplayableLine[] = [
		{
			id: -1,
			hebrewPrayerLibraryId: prayerId,
			lineNumbers: [], // keep raw empty
			displayLineNumbers: [1],
			hebNiqqud: 'בָּרוּךְ אַתָּה יְהוָה אֱלֹהֵינוּ',
			hebText: 'ברוך אתה יהוה אלהינו',
			engTransliteration: 'Baruch atah Yahweh Eloheinu',
			engText: 'Blessed are You, Yahweh our God',
			audioSrc: '/prayers/baruch atah.mp3',
			_group: 0,
		},
		{
			id: -2,
			hebrewPrayerLibraryId: prayerId,
			lineNumbers: [],
			displayLineNumbers: [2],
			hebNiqqud: 'מֶלֶךְ הָעוֹלָם',
			hebText: 'מלך העולם',
			engTransliteration: 'Melech ha’olam',
			engText: 'King of the universe',
			audioSrc: '/prayers/melech haolam.mp3',
			_group: 0,
		},
	]

	const fixedEnd: DisplayableLine[] = [
		{
			id: -3,
			hebrewPrayerLibraryId: prayerId,
			lineNumbers: [],
			displayLineNumbers: [maxDbDisplay + 1],
			hebNiqqud: 'בְּשֵׁם יֵשׁוּעַ הַמָּשִׁיחַ',
			hebText: 'בשם ישוע המשיח',
			engTransliteration: 'B’shem Yeshua ha’Mashiach',
			engText: 'In the name of Yeshua the Messiah',
			audioSrc: '/prayers/bshem.mp3',
			_group: 2,
		},
		{
			id: -4,
			hebrewPrayerLibraryId: prayerId,
			lineNumbers: [],
			displayLineNumbers: [maxDbDisplay + 2],
			hebNiqqud: 'אָמֵן',
			hebText: 'אמן',
			engTransliteration: 'Amen',
			engText: 'Amen',
			audioSrc: '/prayers/amen.mp3',
			_group: 2,
		},
	]

	// Final array: fixed-start → DB → fixed-end (DB already server-sorted)
	const displayLines: DisplayableLine[] = [
		...fixedStart,
		...dbLines,
		...fixedEnd,
	]

	// ✅ Load preferences on mount
	useEffect(() => {
		const saved = localStorage.getItem('prayerTableSettings')
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
		localStorage.setItem('prayerTableSettings', JSON.stringify(prefs))
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
				<Button
					variant={'default'}
					onClick={() => {
						router.push('/prayer')
						router.refresh() // revalidate the next route after the push
					}}
				>
					Back to Prayer List
				</Button>
			</div>
			{/* Controls */}
			<div className="flex flex-wrap gap-4 mb-4 items-center">
				<label className="flex items-center gap-2">
					<input
						type="checkbox"
						checked={showTransliteration}
						onChange={(e) => setShowTransliteration(e.target.checked)}
					/>
					Show Transliteration
				</label>

				<label className="flex items-center gap-2">
					<input
						type="checkbox"
						checked={showEnglish}
						onChange={(e) => setShowEnglish(e.target.checked)}
					/>
					Show English
				</label>

				<label className="flex items-center gap-2">
					<input
						type="checkbox"
						checked={showNiqqud}
						onChange={(e) => setShowNiqqud(e.target.checked)}
					/>
					Show Niqqud
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
				<Button variant={'default'} onClick={() => router.push('/prayer')}>
					All Prayers
				</Button>
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
							{displayLines.map((line) => (
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
										{line.displayLineNumbers?.length
											? line.displayLineNumbers.join(', ')
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
				{displayLines.map((line) => (
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
							{line.displayLineNumbers?.length
								? line.displayLineNumbers.join(', ')
								: ''}
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
