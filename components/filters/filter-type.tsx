'use client'

import { Dispatch, SetStateAction } from 'react'

interface TypeFilterProps {
	selectedType: 'all' | 'word' | 'phrase'
	setSelectedType: Dispatch<SetStateAction<'all' | 'word' | 'phrase'>>
}

export default function TypeFilter({
	selectedType,
	setSelectedType,
}: TypeFilterProps) {
	const typeOptions: ('all' | 'word' | 'phrase')[] = ['all', 'word', 'phrase']

	return (
		<div className="space-y-3 mb-4">
			<h2 className="text-xl font-semibold">Select Type</h2>
			<div className="flex flex-wrap justify-center gap-2">
				{typeOptions.map((type) => (
					<button
						key={type}
						onClick={() => setSelectedType(type)}
						className={`px-3 py-1 border rounded-full text-xs ${
							selectedType === type ? 'bg-sky-600 text-white' : 'bg-gray-200'
						}`}
					>
						{type.charAt(0).toUpperCase() + type.slice(1)}
					</button>
				))}
			</div>
		</div>
	)
}
