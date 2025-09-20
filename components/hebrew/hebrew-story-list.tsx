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

type Story = {
	id: number | string
	title: string
	hebTitle?: string | null
	titleTransliteration?: string | null
	category?: string | null
	audio?: string | null
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

	const categories = useMemo(() => {
		const set = new Set(
			filteredStories.map(
				(p) => (p.category && p.category.trim()) || 'Uncategorized'
			)
		)
		return ['All', ...Array.from(set).sort()]
	}, [filteredStories])

	const [selectedCategory, setSelectedCategory] = useState<string>('All')

	const visibleStorys = useMemo(() => {
		if (selectedCategory === 'All') return filteredStories
		return filteredStories
			.filter((p) => (p.category && p.category.trim()) || 'Uncategorized')
			.filter(
				(p) =>
					((p.category && p.category.trim()) || 'Uncategorized') ===
					selectedCategory
			)
	}, [filteredStories, selectedCategory])

	const grouped = useMemo(() => {
		return visibleStorys.reduce<Record<string, Story[]>>((acc, p) => {
			const key = (p.category && p.category.trim()) || 'Uncategorized'
			acc[key] ??= []
			acc[key].push(p)
			return acc
		}, {})
	}, [visibleStorys])

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
			{/* Header + Filter */}
			<div className="flex items-center justify-between gap-3">
				{/* Filter button */}
				<div className="flex items-center gap-2">
					<Select value={selectedCategory} onValueChange={setSelectedCategory}>
						<SelectTrigger className="w-[200px]">
							<SelectValue placeholder="Filter by category" />
						</SelectTrigger>
						<SelectContent>
							{categories.map((cat) => (
								<SelectItem key={cat} value={cat}>
									{cat}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{selectedCategory !== 'All' && (
						<Button
							variant="primaryOutline"
							onClick={() => setSelectedCategory('All')}
						>
							Clear
						</Button>
					)}
				</div>
			</div>

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
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{sortedItems.map((story) => {
								const isLocked =
									currentLesson !== null &&
									lessonNum(story.lessonId) > currentLesson

								return (
									<div
										key={story.id}
										className="relative rounded-lg border p-4 shadow hover:shadow-md transition"
									>
										{/* Blue circle in upper-right */}
										{story.lessonId && (
											<div className="absolute top-2 right-2 bg-sky-500 text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center shadow">
												{story.lessonId}
											</div>
										)}
										<h3 className="text-xl font-semibold">{story.title}</h3>

										{story.hebTitle && (
											<p className="text-lg font-hebrew">{story.hebTitle}</p>
										)}

										{story.titleTransliteration && (
											<p className="italic text-gray-600">
												{story.titleTransliteration}
											</p>
										)}
										<Link
											href={`/he/stories/${story.id}`}
											className="inline-block mt-3 px-3 py-1 bg-sky-500 text-white rounded hover:bg-sky-700 transition"
										>
											Read Story
										</Link>
										{/* {isLocked ? (
											<div className="inline-block mt-3 px-3 py-1 bg-gray-400 text-white rounded select-none">
												Locked
											</div>
										) : (
											<Link
												href={`/he/stories/${story.id}`}
												className="inline-block mt-3 px-3 py-1 bg-sky-500 text-white rounded hover:bg-sky-700 transition"
											>
												Read Story
											</Link>
										)} */}
									</div>
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
