'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useMemo } from 'react'

type Story = {
	id: number | string
	title: string
	hebTitle?: string | null
	titleTransliteration?: string | null
	category?: string | null
	audio?: string | null
	image?: string | null
	video?: string | null
	public: boolean
	lessonId?: number | null
	courseId?: number[] | null
}

export default function StoryList({
	stories,
	isFriend,
	currentLesson,
}: {
	stories: Story[]
	isFriend: boolean
	currentLesson: number | null
}) {
	const filteredStories = useMemo(
		() => (isFriend ? stories : stories.filter((s) => s.public)),
		[stories, isFriend]
	)

	const grouped = useMemo(() => {
		return filteredStories.reduce<Record<string, Story[]>>((acc, p) => {
			const key = (p.category && p.category.trim()) || 'Uncategorized'
			acc[key] ??= []
			acc[key].push(p)
			return acc
		}, {})
	}, [filteredStories])

	const groupsInOrder = useMemo(
		() =>
			Object.keys(grouped)
				.sort()
				.map((k) => [k, grouped[k]] as const),
		[grouped]
	)

	const lessonNum = (n?: number | null) =>
		typeof n === 'number' ? n : Number.POSITIVE_INFINITY

	return (
		<div className="space-y-4">
			{/* Grouped lists */}
			{groupsInOrder.map(([cat, items]) => {
				// sort by parsed lessonId
				const sortedItems = [...items].sort(
					(a, b) => lessonNum(a.lessonId) - lessonNum(b.lessonId)
				)
				return (
					<div key={cat} className="space-y-2">
						<h2 className="text-lg font-semibold text-neutral-700 uppercase">
							{cat}
						</h2>
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" dir="rtl">
							{sortedItems.map((story) => {
								const isLocked =
									currentLesson !== null &&
									lessonNum(story.lessonId) > currentLesson

								return (
									<div
										key={story.id}
										className="relative rounded-lg border p-0 overflow-hidden shadow hover:shadow-md transition bg-white"
									>
										{/* Lesson badge */}
										{story.lessonId && (
											<div className="absolute top-2 right-2 z-10 bg-sky-600 text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center shadow">
												{story.lessonId}
											</div>
										)}

										{/* Clickable image area */}
										<Link href={`/he/stories/${story.id}`} className="block">
											<div className="relative aspect-[16/9]">
												{story.image ? (
													<Image
														src={story.image}
														alt={story.title}
														fill
														priority={false}
														// placeholder={story.blurDataURL ? 'blur' : 'empty'}
														// blurDataURL={story.blurDataURL || undefined}
														className="object-cover"
														sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
													/>
												) : (
													// Fallback if no image provided
													<div className="absolute inset-0 bg-gradient-to-br from-sky-100 to-sky-200 flex items-center justify-center text-sky-700">
														<span className="text-sm font-medium opacity-80">
															No thumbnail
														</span>
													</div>
												)}
											</div>
										</Link>

										{/* Text content */}
										<div className="p-4" dir="rtl">
											<h3 className="text-4xl font-times">{story.hebTitle}</h3>

											{story.hebTitle && (
												<p className="text-base font-nunito mt-1">
													{story.title}
												</p>
											)}

											{story.titleTransliteration && (
												<p className="italic text-gray-600 mt-0.5">
													{story.titleTransliteration}
												</p>
											)}

											<div className="mt-3">
												<Link
													href={`/he/stories/${story.id}`}
													className="inline-block px-3 py-1 bg-sky-600 text-white rounded hover:bg-sky-700 transition"
												>
													קרא
												</Link>
											</div>
										</div>
									</div>

									// 	{/* {isLocked ? (
									// 		<div className="inline-block mt-3 px-3 py-1 bg-gray-400 text-white rounded select-none">
									// 			Locked
									// 		</div>
									// 	) : (
									// 		<Link
									// 			href={`/he/stories/${story.id}`}
									// 			className="inline-block mt-3 px-3 py-1 bg-sky-600 text-white rounded hover:bg-sky-700 transition"
									// 		>
									// 			Read Story
									// 		</Link>
									// 	)} */}
									// </div>
								)
							})}
						</div>
					</div>
				)
			})}

			{/* Empty state */}
			{groupsInOrder.length === 0 && (
				<div className="text-center text-sm text-neutral-500 py-12">
					No stories found in this category.
				</div>
			)}
		</div>
	)
}
