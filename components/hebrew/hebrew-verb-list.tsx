'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
	Select,
	SelectTrigger,
	SelectContent,
	SelectItem,
	SelectValue,
} from '@/components/ui/select'
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
	currentLesson,
}: {
	allVerbs: HebrewVerb[]
	currentLesson: number | null
}) {
	const sortedVerbs = useMemo(
		() => [...allVerbs].sort((a, b) => (a.lesson ?? 9999) - (b.lesson ?? 9999)),
		[allVerbs]
	)

	return (
		<div className="space-y-6">
			<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{sortedVerbs.map((verb, i) => {
					const verbLocked =
						currentLesson !== null && verb.lesson > currentLesson

					return (
						<div
							key={i}
							className={`relative rounded-lg border overflow-hidden shadow hover:shadow-md transition bg-white ${
								verbLocked ? 'opacity-50 pointer-events-none' : ''
							}`}
						>
							{/* Lesson badge */}
							{verb.lesson && (
								<div className="absolute top-2 right-2 z-10 bg-sky-600 text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center shadow">
									{verb.lesson}
								</div>
							)}

							{/* Image */}
							<Link href={`/he/verbs/${verb.strongs}`} className="block">
								<div className="relative aspect-[16/9]">
									{verb.img ? (
										verb.img.endsWith('.mp4') || verb.img.endsWith('.webm') ? (
											<video
												src={verb.img}
												className="absolute inset-0 w-full h-full object-cover"
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
										<div className="absolute inset-0 bg-gradient-to-br from-sky-100 to-sky-200 flex items-center justify-center text-sky-700">
											<span className="text-sm font-medium opacity-80">
												No image
											</span>
										</div>
									)}
								</div>
							</Link>

							{/* Text content */}
							<div className="p-4" dir="rtl">
								<h3 className="text-4xl font-times">{verb.verb}</h3>

								{verb.engTransliteration && (
									<p className="italic text-gray-600 mt-0.5">
										{verb.engTransliteration}
									</p>
								)}

								{verb.engTranslation && (
									<p className="text-base font-nunito mt-1">
										{verb.engTranslation}
									</p>
								)}

								<p className="text-sm text-neutral-500 mt-1">
									<strong>Strong’s:</strong> {verb.strongs}
								</p>

								{/* Binyan buttons */}
								<div className="mt-4 flex flex-wrap gap-2 justify-center">
									{binyanim.map(({ name, label, Icon, color }) => {
										// get this verb’s binyan lesson number
										const binyanLesson = verb[name as keyof HebrewVerb] as
											| number
											| null

										// available only if number exists and <= currentLesson
										const isUnlocked =
											binyanLesson !== null &&
											currentLesson !== null &&
											binyanLesson <= currentLesson

										// locked if number > currentLesson
										const isLocked =
											binyanLesson !== null &&
											currentLesson !== null &&
											binyanLesson > currentLesson

										return (
											<div key={name} className="flex flex-col items-center">
												{isUnlocked ? (
													<Link
														href={`/he/verbs/${name}/${verb.strongs}`}
														className="flex flex-col items-center"
														title={label}
													>
														<div
															className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-transform duration-200 ${color} hover:scale-110`}
														>
															<Icon
																className="w-5 h-5 text-white drop-shadow-sm"
																strokeWidth={2.5}
															/>
														</div>
														<span className="text-xs mt-1 font-semibold text-gray-700 select-none">
															{label}
														</span>
													</Link>
												) : (
													<div
														className={`flex flex-col items-center ${
															isLocked
																? 'opacity-40 grayscale cursor-not-allowed'
																: 'opacity-30 cursor-not-allowed'
														}`}
													>
														<div
															className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}
														>
															<Icon
																className="w-5 h-5 text-white"
																strokeWidth={2.5}
															/>
														</div>
														<span className="text-xs mt-1 font-semibold text-gray-400 select-none">
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

				{sortedVerbs.length === 0 && (
					<div className="text-center text-sm text-neutral-500 py-12">
						No verbs found.
					</div>
				)}
			</div>
		</div>
	)
}
