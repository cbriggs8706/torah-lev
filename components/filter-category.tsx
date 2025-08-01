'use client'

import { HebrewVocab } from '@/lib/vocab'
import { useMemo } from 'react'

interface CategoryFilterProps {
	data: HebrewVocab[]
	selectedCategory: string
	setSelectedCategory: React.Dispatch<React.SetStateAction<string>>
}

export default function CategoryFilter({
	data,
	selectedCategory,
	setSelectedCategory,
}: CategoryFilterProps) {
	// Get unique categories
	const categoryOptions = useMemo(() => {
		const all = data
			.map((card) => card.category)
			.filter((c): c is string => !!c)
		return Array.from(new Set(all)).sort()
	}, [data])

	return (
		<div className="space-y-3 mb-4">
			<h2 className="text-xl font-semibold">Select Category</h2>
			<div className="flex flex-wrap justify-center gap-2">
				{/* "All" button */}
				<button
					onClick={() => setSelectedCategory('all')}
					className={`px-3 py-1 border rounded-full text-xs ${
						selectedCategory === 'all'
							? 'bg-blue-500 text-white'
							: 'bg-gray-200'
					}`}
				>
					All
				</button>

				{/* Category Buttons */}
				{categoryOptions.map((category) => (
					<button
						key={category}
						onClick={() => setSelectedCategory(category)}
						className={`px-3 py-1 border rounded-full text-xs ${
							selectedCategory === category
								? 'bg-blue-500 text-white'
								: 'bg-gray-200'
						}`}
					>
						{category}
					</button>
				))}
			</div>
		</div>
	)
}
