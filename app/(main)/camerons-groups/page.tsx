import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { addDays } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'

import { listEvents, getUserProgress, getUserSubscription } from '@/db/queries'
import { FeedWrapper } from '@/components/feed-wrapper'
import EventsFilter from '@/components/filters/filter-events'

type Props = {
	searchParams: {
		cat?: string | string[]
		from?: string // yyyy-MM-dd
		to?: string // yyyy-MM-dd
	}
}

function groupByLocalDate<T extends { startTime: Date }>(rows: T[]) {
	const tz = 'America/Boise'
	const map = new Map<string, T[]>()
	for (const r of rows) {
		const key = formatInTimeZone(r.startTime, tz, 'yyyy-MM-dd')
		if (!map.has(key)) map.set(key, [])
		map.get(key)!.push(r)
	}
	return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? -1 : 1))
}

function formatYMDtoTZ(d: Date, timeZone: string) {
	// en-CA gives YYYY-MM-DD
	return new Intl.DateTimeFormat('en-CA', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).format(d)
}

export default async function CameronsGroupsPage({ searchParams }: Props) {
	const [userProgress, userSubscription] = await Promise.all([
		getUserProgress(),
		getUserSubscription(),
	])

	if (!userProgress || !userProgress.activeCourse) {
		redirect('/courses')
	}

	const tz = 'America/Boise'

	const todayStr = formatYMDtoTZ(new Date(), tz)
	const fourWeeksStr = formatYMDtoTZ(addDays(new Date(), 28), tz)

	const fromStr =
		typeof searchParams.from === 'string' && searchParams.from
			? searchParams.from
			: todayStr

	const toStr =
		typeof searchParams.to === 'string' && searchParams.to
			? searchParams.to
			: fourWeeksStr

	const cats = Array.isArray(searchParams.cat)
		? searchParams.cat
		: searchParams.cat
		? [searchParams.cat]
		: []

	const rows = await listEvents({
		categories: cats.length ? cats : undefined,
		fromStr,
		toStr,
	})

	const grouped = groupByLocalDate(rows)

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/mascot.svg"
						alt="Cameron's Study Groups"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
						Cameron&apos;s Study Groups
					</h1>

					{/* Pass initial dates so the filter UI shows the defaults */}
					<EventsFilter
						initialCats={cats}
						initialFrom={fromStr}
						initialTo={toStr}
					/>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
						{grouped.length === 0 && (
							<div className="text-center text-neutral-500 py-12 w-full">
								No events match your filters.
							</div>
						)}

						{grouped.map(([dayKey, dayEvents]) => {
							const displayDate = formatInTimeZone(
								new Date(dayKey),
								tz,
								'EEEE, MMM d, yyyy'
							)
							return (
								<div
									key={dayKey}
									className="w-full bg-white rounded-md shadow-lg p-4 border border-solid border-sky-500"
								>
									<h2 className="text-2xl font-bold mt-4 mb-2">
										{displayDate}
									</h2>
									<ul className="mb-8 space-y-1">
										{dayEvents.map((ev) => {
											const time = formatInTimeZone(ev.startTime, tz, 'h:mm a')
											return (
												<li key={ev.id} className="flex items-center flex-wrap">
													<span className="inline-flex items-center">
														{time}
														<span className="ml-2 text-xs px-2 py-0.5 rounded bg-sky-100 text-sky-700">
															{ev.category}
														</span>
														{ev.zoomUrl && (
															<Link
																href={ev.zoomUrl}
																className="inline-block ml-1"
																title="Join Zoom"
															>
																<Image
																	src="/zoom.svg"
																	alt="Zoom link"
																	width={15}
																	height={15}
																/>
															</Link>
														)}
													</span>
													<span className="ml-2">
														– {ev.name}
														{ev.recordingUrl && (
															<Link
																href={ev.recordingUrl}
																className="inline-block ml-1"
																title="Session Recording"
															>
																<Image
																	src="/youtube.svg"
																	alt="Session Recording"
																	width={20}
																	height={20}
																/>
															</Link>
														)}
													</span>
												</li>
											)
										})}
									</ul>
								</div>
							)
						})}
					</div>
				</div>
			</FeedWrapper>
		</div>
	)
}
