'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { HDate, Location } from '@hebcal/core'
import SunCalc from 'suncalc'
import Link from 'next/link'

// Map for modern Hebrew month names (no niqqud)
const hebrewMonthMap: Record<string, string> = {
	Nisan: 'ניסן',
	Iyyar: 'אייר',
	Sivan: 'סיון',
	Tammuz: 'תמוז',
	Av: 'אב',
	Elul: 'אלול',
	Tishrei: 'תשרי',
	Cheshvan: 'חשוון',
	Kislev: 'כסלו',
	Tevet: 'טבת',
	Shevat: 'שבט',
	Adar: 'אדר',
	'Adar I': 'אדר א׳',
	'Adar II': 'אדר ב׳',
}

// Biblical-style month info
const hebrewMonths: Record<
	number,
	{
		ordinal: string
		preExile: string
		postExile: string
		modernHebrew: string
	}
> = {
	1: {
		ordinal: '1st month',
		preExile: 'אביב',
		modernHebrew: 'Nisan',
		postExile: 'ניסן',
	},
	2: {
		ordinal: '2nd month',
		preExile: 'זיו',
		modernHebrew: 'Iyyar',
		postExile: 'אייר',
	},
	3: {
		ordinal: '3rd month',
		preExile: '',
		modernHebrew: 'Sivan',
		postExile: 'סיון',
	},
	4: {
		ordinal: '4th month',
		preExile: '',
		modernHebrew: 'Tammuz',
		postExile: 'תמוז',
	},
	5: {
		ordinal: '5th month',
		preExile: '',
		modernHebrew: 'Ab',
		postExile: 'אב',
	},
	6: {
		ordinal: '6th month',
		preExile: '',
		modernHebrew: 'Elul',
		postExile: 'אלול',
	},
	7: {
		ordinal: '7th month',
		preExile: 'איתנים',
		modernHebrew: 'Tishrei',
		postExile: 'תשרי',
	},
	8: {
		ordinal: '8th month',
		preExile: 'בול',
		modernHebrew: 'Cheshvan',
		postExile: 'חשוון',
	},
	9: {
		ordinal: '9th month',
		preExile: '',
		modernHebrew: 'Kislev',
		postExile: 'כסלו',
	},
	10: {
		ordinal: '10th month',
		preExile: '',
		modernHebrew: 'Tevet',
		postExile: 'טבת',
	},
	11: {
		ordinal: '11th month',
		preExile: '',
		modernHebrew: 'Shevat',
		postExile: 'שבט',
	},
	12: {
		ordinal: '12th month',
		preExile: '',
		modernHebrew: 'Adar',
		postExile: 'אדר',
	},
	13: {
		ordinal: '13th month',
		preExile: '',
		modernHebrew: 'Adar II (leap)',
		postExile: 'אדר ב׳',
	},
}

// Hebrew ordinal numbers (Biblical style)
const hebrewOrdinals: Record<number, string> = {
	1: 'הָרִאשׁוֹן',
	2: 'הַשֵּׁנִי',
	3: 'הַשְּׁלִישִׁי',
	4: 'הָרְבִיעִי',
	5: 'הַחֲמִישִׁי',
	6: 'הַשִּׁשִּׁי',
	7: 'הַשְּׁבִיעִי',
	8: 'הַשְּׁמִינִי',
	9: 'הַתְּשִׁיעִי',
	10: 'הָעֲשִׂירִי',
	11: 'הָאַחַד־עָשָׂר',
	12: 'הַשְּׁנֵים־עָשָׂר',
	13: 'הַשְּׁלוֹשָׁה־עָשָׂר',
}

const englishOrdinals: Record<number, string> = {
	1: '1st',
	2: '2nd',
	3: '3rd',
	4: '4th',
	5: '5th',
	6: '6th',
	7: '7th',
	8: '8th',
	9: '9th',
	10: '10th',
	11: '11th',
	12: '12th',
	13: '13th',
}

function getMoonIconByPhase(phaseFraction: number): string {
	// phaseFraction is between 0 and 1
	const phaseIndex = Math.round(phaseFraction * 29) // 0–29
	const iconIndex = Math.floor((phaseIndex / 29) * 16) + 1 // 1–16
	return `/moon/moon-${iconIndex}.svg`
}

function getPhaseName(phase: number): string {
	if (phase === 0) return 'New Moon'
	if (phase < 7) return 'Waxing Crescent'
	if (phase === 7) return 'First Quarter'
	if (phase < 14) return 'Waxing Gibbous'
	if (phase === 14) return 'Full Moon'
	if (phase < 21) return 'Waning Gibbous'
	if (phase === 21) return 'Last Quarter'
	return 'Waning Crescent'
}

// Convert Hebrew year to gematria string
function hebrewYearGematria(year: number): string {
	const gematriaMap: Record<number, string> = {
		1: 'א',
		2: 'ב',
		3: 'ג',
		4: 'ד',
		5: 'ה',
		6: 'ו',
		7: 'ז',
		8: 'ח',
		9: 'ט',
		10: 'י',
		20: 'כ',
		30: 'ל',
		40: 'מ',
		50: 'נ',
		60: 'ס',
		70: 'ע',
		80: 'פ',
		90: 'צ',
		100: 'ק',
		200: 'ר',
		300: 'ש',
		400: 'ת',
	}

	let remainder = year % 1000 // Drop thousands digit
	let result = ''

	const values = Object.keys(gematriaMap)
		.map(Number)
		.sort((a, b) => b - a) // highest to lowest

	for (const value of values) {
		while (remainder >= value) {
			result += gematriaMap[value]
			remainder -= value
		}
	}

	// Special handling for gershayim
	if (result.length > 1) {
		result = result.slice(0, -1) + '״' + result.slice(-1)
	} else {
		result += '׳'
	}

	return `בִּשְׁנַת ${result}`
}

export function HebrewClock() {
	const [hebrewDate, setHebrewDate] = useState<{
		day: number
		monthNum: number
		monthNameEnglish: string
		monthNameHebrew: string
		year: number
	} | null>(null)

	const [moonPhase, setMoonPhase] = useState<string>('')

	useEffect(() => {
		const now = new Date()
		const hd = new HDate(now)
		const monthNum = hd.getMonth()
		const monthName = hd.getMonthName()

		setHebrewDate({
			day: hd.getDate(),
			monthNum,
			monthNameEnglish: monthName,
			monthNameHebrew: hebrewMonthMap[monthName] || monthName,
			year: hd.getFullYear(),
		})

		const phaseFraction = SunCalc.getMoonIllumination(now).phase
		const moonIcon = getMoonIconByPhase(phaseFraction)
		setMoonPhase(moonIcon)
	}, [])

	if (!hebrewDate) return null

	const monthInfo = hebrewMonths[hebrewDate.monthNum]
	const monthHebrewOrdinalTitle = `הַחֹדֶשׁ ${
		hebrewOrdinals[hebrewDate.monthNum] || ''
	}`
	const dayHebrew = hebrewOrdinals[hebrewDate.day] || ''
	const monthHebrewOrdinal = hebrewOrdinals[hebrewDate.monthNum] || ''
	const biblicalPhrase = `הַיּוֹם ${dayHebrew} לַחֹדֶשׁ ${monthHebrewOrdinal}`
	const hebrewYearPhrase = hebrewYearGematria(hebrewDate.year)
	const dayEng = englishOrdinals[hebrewDate.day]
	const monthEng = englishOrdinals[hebrewDate.monthNum]
	const englishPhrase = `The ${dayEng} day of the ${monthEng} month in the year ${hebrewDate.year} `

	return (
		<div className="border rounded-xl shadow-md overflow-hidden max-w-md w-full bg-white mb-2">
			{/* Blue Header with Big Month Name */}
			<div className="bg-sky-500 text-white text-center py-3 px-4">
				<h2 className="text-3xl tracking-wide font-serif">
					{monthHebrewOrdinalTitle}
				</h2>
			</div>

			{/* Calendar Body */}
			<div className="p-4 space-y-4 bg-sky-50">
				{/* Hebrew and English Date */}
				<div className="text-right font-frank text-3xl leading-tight">
					<div>{biblicalPhrase}</div>
					<div className="text-3xl">{hebrewYearPhrase}</div>
				</div>

				<div className="text-sm text-gray-700 italic">{englishPhrase}</div>

				{/* Month Info & Moon Phase */}
				<div className="flex justify-between items-center gap-4">
					<div className="text-sm leading-relaxed space-y-1">
						<div>
							<span className="font-semibold">Pre-Exile: </span>
							<span className="font-frank text-2xl">
								{monthInfo.preExile || '—'}
							</span>
						</div>
						<div>
							<span className="font-semibold">Post-Exile: </span>
							<span className="font-frank text-2xl">{monthInfo.postExile}</span>
						</div>
						<div>
							<span className="font-semibold">Modern: </span>
							<span>{monthInfo.modernHebrew}</span>
						</div>
					</div>
					{moonPhase && (
						<div className="bg-sky-900 p-1 rounded-lg">
							<Image
								src={moonPhase}
								alt="Moon phase"
								width={48}
								height={48}
								className="shrink-0"
							/>
						</div>
					)}
				</div>
				<Link
					href="/hebrew-calendar"
					className="flex justify-center text-center"
				>
					View full calendar
				</Link>
			</div>
		</div>
	)
}
// Check all month's spellings with this
// const allMonths = new Set<string>()
// for (let m = 1; m <= 13; m++) {
// 	const hd = new HDate(1, m, 5785)
// 	allMonths.add(hd.getMonthName())
// }
// console.log([allMonths])
