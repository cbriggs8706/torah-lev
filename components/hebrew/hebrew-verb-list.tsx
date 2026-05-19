'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useMemo } from 'react'
import {
	PenLine,
	Shield,
	Flame,
	Sparkles,
	ArrowRight,
	ArrowDown,
	RefreshCw,
} from 'lucide-react'

type HebrewVerb = {
	verb: string
	engTransliteration: string
	engTranslation: string
	strongs: number
	lesson: number
	img: string
	paal: number | null
	piel: number | null
	hifil: number | null
	hitpael: number | null
	hufal: number | null
	pual: number | null
	nifal: number | null
}

const binyanim = [
	{ name: 'paal', label: 'Paal', Icon: PenLine, color: 'bg-blue-500' },
	{ name: 'piel', label: 'Piel', Icon: Flame, color: 'bg-green-500' },
	{ name: 'hifil', label: 'Hifil', Icon: ArrowRight, color: 'bg-orange-500' },
	{ name: 'hitpael', label: 'Hitpael', Icon: RefreshCw, color: 'bg-red-500' },
	{ name: 'hufal', label: 'Hufal', Icon: ArrowDown, color: 'bg-orange-300' },
	{ name: 'pual', label: 'Pual', Icon: Sparkles, color: 'bg-green-300' },
	{ name: 'nifal', label: 'Nifal', Icon: Shield, color: 'bg-blue-300' },
]

export default function HebrewVerbList({
	allVerbs,
	availableRoutes,
}: {
	allVerbs: HebrewVerb[]
	availableRoutes: Record<string, string[]>
}) {
	const sortedVerbs = useMemo(
		() => [...allVerbs].sort((a, b) => (a.lesson ?? 9999) - (b.lesson ?? 9999)),
		[allVerbs]
	)

	const groupedVerbs = useMemo(() => {
		const ranges = new Map<string, HebrewVerb[]>()

		for (const verb of sortedVerbs) {
			const lesson = verb.lesson ?? 9999
			const start = Math.floor((lesson - 1) / 10) * 10 + 1
			const end = start + 9
			const key = `${start}-${end}`

			if (!ranges.has(key)) {
				ranges.set(key, [])
			}

			ranges.get(key)!.push(verb)
		}

		return Array.from(ranges.entries())
	}, [sortedVerbs])

	return (
		<div className="space-y-6">
			{groupedVerbs.map(([range, verbs]) => (
				<section key={range} className="space-y-4">
					<h2 className="rounded-md bg-sky-600 px-4 py-2 text-right text-3xl font-bold text-white">
						Lessons {range}
					</h2>

					<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" dir="rtl">
						{verbs.map((verb, i) => {
							return (
								<div
									key={`${verb.strongs}-${verb.lesson ?? i}`}
									className="relative overflow-hidden rounded-lg border bg-white shadow transition hover:shadow-md"
								>
									{/* Lesson badge */}
									{verb.lesson && (
										<div className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-sky-600 text-sm font-bold text-white shadow">
											{verb.lesson}
										</div>
									)}

									{/* Image */}
									<div className="relative aspect-[16/9]">
										{verb.img ? (
											verb.img.endsWith('.mp4') || verb.img.endsWith('.webm') ? (
												<video
													src={verb.img}
													className="absolute inset-0 h-full w-full object-cover"
													autoPlay
													muted
													loop
													playsInline
												/>
											) : (
												<Image
													src={verb.img}
													alt={verb.verb}
													fill
													className="object-cover"
													sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
												/>
											)
										) : (
											<div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-sky-100 to-sky-200 text-sky-700">
												<span className="text-sm font-medium opacity-80">
													No image
												</span>
											</div>
										)}
									</div>

									{/* Text content */}
									<div className="p-4" dir="rtl">
										<h3 className="text-4xl font-times">{verb.verb}</h3>

										{verb.engTransliteration && (
											<p className="mt-0.5 text-gray-600 italic">
												{verb.engTransliteration}
											</p>
										)}

										{verb.engTranslation && (
											<p className="mt-1 text-base font-nunito">
												{verb.engTranslation}
											</p>
										)}

										<p className="mt-1 text-sm text-neutral-500">
											<strong>Strong’s:</strong> {verb.strongs}
										</p>

										{/* Binyan buttons */}
										<div className="mt-4 flex flex-wrap justify-center gap-2">
											{binyanim.map(({ name, label, Icon, color }) => {
												const isUnlocked = (
													availableRoutes[String(verb.strongs)] ?? []
												).includes(name)

												return (
													<div key={name} className="flex flex-col items-center">
														{isUnlocked ? (
															<Link
																href={`/he/verbs/${name}/${verb.strongs}`}
																className="flex flex-col items-center"
																title={label}
															>
																<div
																	className={`flex h-10 w-10 items-center justify-center rounded-full shadow-sm transition-transform duration-200 hover:scale-110 ${color}`}
																>
																	<Icon
																		className="h-5 w-5 text-white drop-shadow-sm"
																		strokeWidth={2.5}
																	/>
																</div>
																<span className="mt-1 select-none text-xs font-semibold text-gray-700">
																	{label}
																</span>
															</Link>
														) : (
															<div className="flex cursor-not-allowed flex-col items-center opacity-30">
																<div
																	className={`flex h-10 w-10 items-center justify-center rounded-full ${color}`}
																>
																	<Icon
																		className="h-5 w-5 text-white"
																		strokeWidth={2.5}
																	/>
																</div>
																<span className="mt-1 select-none text-xs font-semibold text-gray-400">
																	{label}
																</span>
															</div>
														)}
													</div>
												)
											})}
										</div>
									</div>
								</div>
							)
						})}
					</div>
				</section>
			))}

			{sortedVerbs.length === 0 && (
				<div className="py-12 text-center text-sm text-neutral-500">
					No verbs found.
				</div>
			)}
		</div>
	)
}
