'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { HDate } from '@hebcal/core'
import SunCalc from 'suncalc'
import { ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'

const HEBREW_CHARACTER_REGEX = /[\u0590-\u05FF]/

function containsHebrew(text: string) {
	return HEBREW_CHARACTER_REGEX.test(text)
}

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
	14: 'הָאַרְבָּעָה־עָשָׂר',
	15: 'הַחֲמִשָּׁה־עָשָׂר',
	16: 'הַשִּׁשָּׁה־עָשָׂר',
	17: 'הַשִּׁבְעָה־עָשָׂר',
	18: 'הַשְׁמוֹנָה־עָשָׂר',
	19: 'הַתִּשְׁעָה־עָשָׂר',
	20: 'הֶעֶשְׂרִים',
	21: 'עֶשְׂרִים וְאֶחָד',
	22: 'עֶשְׂרִים וּשְׁנַיִם',
	23: 'עֶשְׂרִים וּשְׁלוֹשָׁה',
	24: 'עֶשְׂרִים וְאַרְבָּעָה',
	25: 'עֶשְׂרִים וַחֲמִשָּׁה',
	26: 'עֶשְׂרִים וְשִׁשָּׁה',
	27: 'עֶשְׂרִים וְשִׁבְעָה',
	28: 'עֶשְׂרִים וּשְׁמוֹנָה',
	29: 'עֶשְׂרִים וְתִשְׁעָה',
	30: 'שְׁלוֹשִׁים',
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
	14: '14th',
	15: '15th',
	16: '16th',
	17: '17th',
	18: '18th',
	19: '19th',
	20: '20th',
	21: '21st',
	22: '22nd',
	23: '23rd',
	24: '24th',
	25: '25th',
	26: '26th',
	27: '27th',
	28: '28th',
	29: '29th',
	30: '30th',
	31: '31st',
}

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

	let remainder = year % 1000
	let result = ''
	const values = Object.keys(gematriaMap)
		.map(Number)
		.sort((a, b) => b - a)

	for (const value of values) {
		while (remainder >= value) {
			result += gematriaMap[value]
			remainder -= value
		}
	}

	if (result.length > 1) {
		result = result.slice(0, -1) + '״' + result.slice(-1)
	} else {
		result += '׳'
	}

	return `בִּשְׁנַת ה׳${result}`
}

function getMoonIconByPhase(phaseFraction: number): string {
	const phaseIndex = Math.round(phaseFraction * 29)
	const iconIndex = Math.floor((phaseIndex / 29) * 16) + 1
	return `/moon/moon-${iconIndex}.svg`
}

function getSnapshot() {
	const now = new Date()
	const hd = new HDate(now)
	const monthNum = hd.getMonth()
	const monthNameEnglish = hd.getMonthName()
	const day = hd.getDate()
	const year = hd.getFullYear()

	return {
		day,
		monthNum,
		monthNameEnglish,
		monthNameHebrew: hebrewMonthMap[monthNameEnglish] || monthNameEnglish,
		year,
		moonIcon: getMoonIconByPhase(SunCalc.getMoonIllumination(now).phase),
	}
}

export function HebrewSidebarCalendar({ onClick }: { onClick?: () => void }) {
	const [snapshot] = useState(getSnapshot)
	const [expanded, setExpanded] = useState(false)

	const dayHebrew = hebrewOrdinals[snapshot.day] || String(snapshot.day)
	const monthHebrew = hebrewOrdinals[snapshot.monthNum] || String(snapshot.monthNum)
	const hebrewLine = `הַיּוֹם ${dayHebrew} לַחֹדֶשׁ ${monthHebrew} ${hebrewYearGematria(snapshot.year)}`
	const englishLine = `${englishOrdinals[snapshot.day] || snapshot.day} day of the ${
		englishOrdinals[snapshot.monthNum] || snapshot.monthNum
	} month`

	return (
		<div className="w-full rounded-2xl border border-sidebar-primary/40 bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
			<button
				type="button"
				onClick={() => setExpanded((current) => !current)}
				className="flex min-h-[72px] w-full items-center justify-between gap-3 rounded-2xl bg-transparent px-4 py-3 text-left text-sidebar-primary-foreground"
			>
				<div className="min-w-0">
					<p className="text-base font-semibold leading-tight">
						{snapshot.monthNameEnglish} /{' '}
						<span className={cn(containsHebrew(snapshot.monthNameHebrew) && 'font-cardo')}>
							{snapshot.monthNameHebrew}
						</span>
					</p>
					<p className="mt-1 text-xs italic text-sidebar-primary-foreground/80">
						{englishLine}
					</p>
				</div>

				<div className="flex items-center gap-3">
					<Image
						src={snapshot.moonIcon}
						alt="Moon phase"
						width={36}
						height={36}
						className="rounded-full bg-white/12 p-1"
					/>
					<ChevronDown
						className={cn(
							'h-4 w-4 shrink-0 transition-transform duration-300',
							expanded ? 'rotate-180' : 'rotate-0',
						)}
					/>
				</div>
			</button>

			{expanded ? (
				<div className="space-y-3 px-4 pb-4">
					<p
						dir="rtl"
						className="font-frank text-xl leading-tight text-sidebar-primary-foreground"
					>
						{hebrewLine}
					</p>
					<Link
						href="/calendar"
						onClick={onClick}
						className="flex justify-center rounded-xl bg-white/14 px-3 py-2 text-sm font-semibold text-sidebar-primary-foreground transition-colors hover:bg-white/22"
					>
						View full calendar
					</Link>
				</div>
			) : null}
		</div>
	)
}
