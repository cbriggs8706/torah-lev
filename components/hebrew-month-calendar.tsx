'use client'

import { useEffect, useState } from 'react'
import { HDate, HebrewCalendar, Location } from '@hebcal/core'
import clsx from 'clsx'

const customEvents = [
	{
		startDay: 15,
		endDay: 21,
		month: 1,
		desc: 'Pesach (Passover)',
		color: 'bg-green-500',
	}, // 15–21 Nisan
	{
		startDay: 1,
		endDay: 2,
		month: 7,
		desc: 'Rosh Hashanah',
		color: 'bg-green-500',
	}, // 1–2 Tishrei
	{
		startDay: 10,
		endDay: 10,
		month: 7,
		desc: 'Yom Kippur',
		color: 'bg-green-500',
	},
	{
		startDay: 11,
		endDay: 11,
		month: 4,
		desc: 'Lesson 4, 25, 35 ',
		color: 'bg-green-300',
	},
	{
		startDay: 18,
		endDay: 18,
		month: 4,
		desc: 'Lesson 26 & 36',
		color: 'bg-yellow-300',
	},
	{
		startDay: 16,
		endDay: 16,
		month: 4,
		desc: 'Shabbat',
		color: 'bg-yellow-300',
	},
]

const daysOfWeekHebrew = [
	'יוֹם רִאשׁוֹן',
	'יוֹם שֵׁנִי',
	'יוֹם שְׁלִישִׁי',
	'יוֹם רְבִיעִי',
	'יוֹם חֲמִישִׁי',
	'יוֹם שִׁשִּׁי',
	'שַׁבָּת',
]

const daysOfWeekEnglish = [
	'Sunday',
	'Monday',
	'Tuesday',
	'Wednesday',
	'Thursday',
	'Friday',
	'Saturday',
]

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

function getEnglishOrdinal(n: number): string {
	const s = ['th', 'st', 'nd', 'rd']
	const v = n % 100
	return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`
}

function getHebrewOrdinalDay(n: number): string {
	const ordinals: Record<number, string> = {
		1: 'רִאשׁוֹן',
		2: 'שֵּׁנִי',
		3: 'שְּׁלִישִׁי',
		4: 'רְבִיעִי',
		5: 'חֲמִישִׁי',
		6: 'שִּׁשִּׁי',
		7: 'שְּׁבִיעִי',
		8: 'שְּׁמִינִי',
		9: 'תְּשִׁיעִי',
		10: 'עֲשִׂירִי',
		11: 'אַחַד עָשָׂר',
		12: 'שְּׁנֵים עָשָׂר',
		13: 'שְּׁלוֹשָׁה עָשָׂר',
		14: 'אַרְבָּעָה עָשָׂר',
		15: 'חֲמִשָּׁה עָשָׂר',
		16: 'שִּׁשָּׁה עָשָׂר',
		17: 'שִּׁבְעָה עָשָׂר',
		18: 'שְּׁמוֹנָה עָשָׂר',
		19: 'תִּשְׁעָה עָשָׂר',
		20: 'עֶשְׂרִים',
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

	return `יּוֹם ${ordinals[n] || n}`
}

export default function HebrewMonthCalendar() {
	const [monthData, setMonthData] = useState<any[]>([])
	const [monthName, setMonthName] = useState('')
	const [year, setYear] = useState(5785)

	useEffect(() => {
		const today = new HDate()
		const todayDay = today.getDate()
		const todayMonth = today.getMonth()
		const todayYear = today.getFullYear()

		const month = today.getMonth()
		const year = today.getFullYear()
		const days: any[] = []

		const start = new HDate(1, month, year)
		const end = new HDate(start.daysInMonth(), month, year)

		for (let d = 1; d <= start.daysInMonth(); d++) {
			const date = new HDate(d, month, year)
			const gDate = date.greg()
			const weekday = date.getDay()
			const holiday = customEvents.find(
				(ev) => ev.month === month && d >= ev.startDay && d <= ev.endDay
			)

			days.push({
				hebrewDate: getHebrewOrdinalDay(d),
				englishDate: `${getEnglishOrdinal(d)} Day`,
				gregorian: gDate.toLocaleDateString('en-US', {
					month: 'short',
					day: 'numeric',
				}),
				weekday,
				holiday: holiday?.desc,
				color: holiday?.color,
				isToday: d === todayDay && month === todayMonth && year === todayYear,
			})
		}

		setMonthData(days)
		setMonthName(hebrewOrdinals[start.getMonth()])
		setYear(year)
	}, [])

	const weeks: any[][] = []
	let week: any[] = []

	monthData.forEach((day, idx) => {
		// If this is the first day of the month, fill in empty days before it
		if (idx === 0) {
			for (let i = 0; i < day.weekday; i++) {
				week.push(null)
			}
		}

		week.push(day)

		if (week.length === 7) {
			weeks.push(week)
			week = []
		}
	})

	if (week.length > 0) {
		// Fill the rest of the final week with nulls
		while (week.length < 7) {
			week.push(null)
		}
		weeks.push(week)
	}

	return (
		<div className="p-4 bg-white rounded-xl shadow">
			<div className="bg-red-600 text-white text-center py-3 rounded-t-xl">
				<h2 className="text-5xl font-serif">הַחֹדֶשׁ {monthName}</h2>
				<p className="text-sm italic">{year}</p>
			</div>
			<div dir="rtl" className="grid grid-cols-7 border-t">
				{[...daysOfWeekHebrew].map((name, i) => (
					<div
						key={i}
						className="text-center font-bold py-2 border-b bg-sky-50"
					>
						{name}
					</div>
				))}

				{weeks.map((week, wi) =>
					week.map((day, di) => (
						<div
							key={`${wi}-${di}`}
							className={clsx(
								'border p-2 h-36 flex flex-col justify-between text-right',
								!day && 'bg-gray-100',
								day?.isToday && 'bg-blue-100 border-blue-500'
							)}
						>
							{day && (
								<>
									<div className="flex flex-col h-full justify-between text-right">
										<div className="text-xs md:text-lg leading-none font-serif">
											{day.hebrewDate}
										</div>
										<div className="text-xs text-gray-700">
											{day.englishDate}
										</div>

										{/* Spacer */}
										<div className="flex-1 flex items-center">
											{day.holiday && (
												<div
													className={`${day.color} text-[10px] px-1 rounded-sm truncate`}
												>
													{day.holiday}
												</div>
											)}
										</div>

										{/* Gregorian Date (always bottom) */}
										<div className="text-[10px] italic text-gray-400">
											{day.gregorian}
										</div>
									</div>
								</>
							)}
						</div>
					))
				)}
			</div>
		</div>
	)
}
