'use client'

import { useEffect, useState } from 'react'
import { HDate, HebrewCalendar, Location } from '@hebcal/core'
import clsx from 'clsx'
import { HebrewClock } from './hebrew-clock'

const customEvents = [
	// 1️⃣ Passover (Pesach)
	{
		startDay: 15,
		endDay: 21,
		month: 1,
		desc: 'Pesach (Passover)',
		hebDesc: 'פֶּסַח',
		color: 'bg-green-500',
		countdown: false,
	}, // 15–21 Nisan

	// 2️⃣ Feast of Unleavened Bread (Chag HaMatzot) - overlaps with Passover but listed separately
	{
		startDay: 15,
		endDay: 21,
		month: 1,
		desc: 'Feast of Unleavened Bread',
		hebDesc: 'חַג הַמַּצּוֹת',
		color: 'bg-green-500',
		countdown: false,
	},

	// 3️⃣ Feast of Firstfruits (Yom HaBikkurim)
	{
		startDay: 16,
		endDay: 16,
		month: 1,
		desc: 'Firstfruits',
		hebDesc: 'יוֹם הַבִּכּוּרִים',
		color: 'bg-green-500',
		countdown: false,
	}, // 16 Nisan

	// 4️⃣ Feast of Weeks (Shavuot)
	{
		startDay: 6,
		endDay: 6,
		month: 3,
		desc: 'Shavuot (Feast of Weeks)',
		hebDesc: 'שָׁבוּעוֹת',
		color: 'bg-green-500',
		countdown: false,
	}, // 6 Sivan

	// 5️⃣ Feast of Trumpets (Rosh Hashanah / Yom Teruah)
	{
		startDay: 1,
		endDay: 2,
		month: 7,
		desc: 'Rosh Hashanah (Yom Teruah)',
		hebDesc: 'יוֹם תְּרוּעָה',
		color: 'bg-green-500',
		countdown: true,
	}, // 1–2 Tishrei

	// 6️⃣ Day of Atonement (Yom Kippur)
	{
		startDay: 10,
		endDay: 10,
		month: 7,
		desc: 'Yom Kippur (Day of Atonement)',
		hebDesc: 'יוֹם הַכִּפּוּרִים',
		color: 'bg-green-500',
		countdown: false,
	}, // 10 Tishrei

	// 7️⃣ Feast of Tabernacles (Sukkot)
	{
		startDay: 15,
		endDay: 21,
		month: 7,
		desc: 'Sukkot (Feast of Tabernacles)',
		hebDesc: 'סֻכּוֹת',
		color: 'bg-green-500',
		countdown: false,
	}, // 15–21 Tishrei

	// {
	// 	startDay: 11,
	// 	endDay: 11,
	// 	month: 4,
	// 	desc: 'Lesson 4, 25, 35 ',
	// 	color: 'bg-green-300',
	// 	countdown: false,
	// },
	// {
	// 	startDay: 18,
	// 	endDay: 18,
	// 	month: 4,
	// 	desc: 'Lesson 26 & 36',
	// 	color: 'bg-yellow-300',
	// 	countdown: false,
	// },
	// {
	// 	startDay: 16,
	// 	endDay: 16,
	// 	month: 4,
	// 	desc: 'Shabbat',
	// 	color: 'bg-yellow-300',
	// 	countdown: false,
	// },
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
	const [nextCountdownEvent, setNextCountdownEvent] = useState<any | null>(null)
	const [countdownTime, setCountdownTime] = useState<{
		days: number
		hours: number
		minutes: number
		seconds: number
	} | null>(null)

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

	useEffect(() => {
		const now = new Date()
		const todayHebrew = new HDate()

		const upcoming = customEvents
			.map((ev) => {
				let eventHebrewDate = new HDate(
					ev.startDay,
					ev.month,
					todayHebrew.getFullYear()
				)

				// If the Hebrew date already passed, push it to the next year
				if (eventHebrewDate.abs() <= todayHebrew.abs()) {
					eventHebrewDate = new HDate(
						ev.startDay,
						ev.month,
						todayHebrew.getFullYear() + 1
					)
				}

				const gDate = eventHebrewDate.greg()
				gDate.setHours(18, 0, 0, 0) // sundown

				return { ...ev, gDate }
			})
			.filter((ev) => ev.countdown && ev.gDate > now)
			.sort((a, b) => a.gDate.getTime() - b.gDate.getTime())

		if (upcoming.length > 0) {
			setNextCountdownEvent(upcoming[0])
			const interval = setInterval(() => {
				const diff = upcoming[0].gDate.getTime() - Date.now()

				if (diff <= 0) {
					setCountdownTime(null)
					clearInterval(interval)
					return
				}

				const days = Math.floor(diff / (1000 * 60 * 60 * 24))
				const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
				const minutes = Math.floor((diff / (1000 * 60)) % 60)
				const seconds = Math.floor((diff / 1000) % 60)

				setCountdownTime({ days, hours, minutes, seconds })
			}, 1000)

			return () => clearInterval(interval)
		}
	}, [])

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
		<>
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
									day?.isToday && 'bg-sky-100 border-sky-500'
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
			<div className="flex flex-col md:flex-row justify-between gap-8 mt-8">
				{nextCountdownEvent && countdownTime && (
					<div className="border rounded-xl shadow-md overflow-hidden max-w-md w-full bg-yellow-50 mb-2 flex gap-4 flex-col">
						<div className="p-4 bg-yellow-400 text-white py-3 px-4 rounded-t-xl shadow text-center space-y-2">
							<h3 className="text-xl font-semibold">
								Countdown to {nextCountdownEvent.desc}
							</h3>
						</div>
						<div className="text-center flex flex-col gap-4">
							<h3 className="font-serif text-3xl">
								{nextCountdownEvent.hebDesc}
							</h3>
							<p className="text-lg">
								{countdownTime.days}d {countdownTime.hours}h{' '}
								{countdownTime.minutes}m {countdownTime.seconds}s
							</p>
							<div className="flex flex-col text-center justify-center mx-auto">
								<p className="text-3xl font-serif">עוֹד</p>
								<p className="text-right" dir="rtl">
									<span className="font-nunito text-xl">
										{countdownTime.days}
									</span>{' '}
									<span className="font-serif text-3xl">
										יוֹם{countdownTime.days !== 1 ? 'ים' : ''}
									</span>
								</p>
								<p className="text-right" dir="rtl">
									<span className="font-nunito text-xl">
										{countdownTime.hours}
									</span>{' '}
									<span className="font-serif text-3xl">
										שָׁעָה{countdownTime.hours !== 1 ? 'וֹת' : ''}
									</span>
								</p>
								<p className="text-right" dir="rtl">
									<span className="font-nunito text-xl">
										{countdownTime.minutes}
									</span>{' '}
									<span className="font-serif text-3xl">
										דָּקָה{countdownTime.minutes !== 1 ? 'וֹת' : ''}
									</span>
								</p>
								<p className="text-right" dir="rtl">
									<span className="font-serif text-3xl">וְ-</span>
									<span className="font-nunito text-xl">
										{countdownTime.seconds}
									</span>{' '}
									<span className="font-serif text-3xl">
										שְׁנִיָּה{countdownTime.seconds !== 1 ? 'וֹת' : ''}
									</span>
								</p>
							</div>
						</div>
					</div>
				)}
				<HebrewClock isWidget={false} />
			</div>
			<div className="flex gap-8 flex-col mt-8">
				<h2 className="font-semibold text-2xl">How do we write the year?</h2>
				<p>
					The gershayim (״) is placed before the final letter of the
					number/abbreviation—as opposed to the beginning or end. It marks that
					this group of letters is a number (or sometimes an acronym).
				</p>
				<ul>
					<li>
						400 = <span className="font-serif text-3xl">ת</span>
					</li>
					<li>
						300 = <span className="font-serif text-3xl">ש</span>
					</li>
					<li>
						80 = <span className="font-serif text-3xl">פ</span>
					</li>
					<li>
						5 = <span className="font-serif text-3xl">ה</span>
					</li>
				</ul>
				<p>
					In modern Hebrew usage, the thousands digit (5000 in this case) is
					understood and usually not written. The modern letter combination
					<span className="font-serif text-3xl"> תשפ״ה </span>only represents
					785, but it is understood in context to mean 5785. If we need to refer
					to years before our current millenia we add a prefix with the
					appropriate letter and a single :{' '}
					<span className="font-serif text-3xl">ב׳ </span>For the current we
					could use<span className="font-serif text-3xl"> ה׳</span>
				</p>
				<p>
					The Hebrew calendar traditionally begins with the creation of the
					world (Year 1 = Bereshit / Genesis 1). This is called Anno Mundi (AM),
					meaning &quot;year of the world.&quot; So you could refer to the test
					of Abraham as happening around: Year 2085{' '}
					<span className="font-serif text-3xl">
						ב׳תפ״ה לְבְּרִיאָת הָעוֹלָם{' '}
					</span>
					(from the creation of the world).
				</p>
				<p></p>
			</div>
		</>
	)
}
