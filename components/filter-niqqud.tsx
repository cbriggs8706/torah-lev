'use client'

import { HebrewVocab } from '@/lib/vocab'

interface NiqqudFilterProps {
	data: HebrewVocab[]
	hebrewField: 'heb' | 'hebNiqqud'
	setHebrewField: React.Dispatch<React.SetStateAction<'heb' | 'hebNiqqud'>>
}

export default function NiqqudFilter({
	data,
	hebrewField,
	setHebrewField,
}: NiqqudFilterProps) {
	return (
		<div className="mb-4 space-y-3">
			<h2 className="text-xl font-semibold">Niqqud</h2>
			<div className="flex flex-wrap justify-center gap-2 mt-2">
				{(['heb', 'hebNiqqud'] as const).map((field) => (
					<button
						key={field}
						onClick={() => setHebrewField(field)}
						className={`px-3 py-1 border rounded-full text-xs ${
							hebrewField === field ? 'bg-blue-500 text-white' : 'bg-gray-200'
						}`}
					>
						{field === 'heb' ? 'Without Niqqud' : 'With Niqqud'}
					</button>
				))}
			</div>
		</div>
	)
}
