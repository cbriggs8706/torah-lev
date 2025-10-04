'use client'

import { Dispatch, SetStateAction } from 'react'

export type FormatType = 'image' | 'audio' | 'translation' | 'letter-by-letter'

interface FormatFilterProps {
	formatType: FormatType
	setFormatType: Dispatch<SetStateAction<FormatType>>
	options: FormatType[] // <-- add this
}

export default function FormatFilter({
	formatType,
	setFormatType,
	options,
}: FormatFilterProps) {
	return (
		<div className="mb-4 space-y-3">
			<h2 className="font-semibold text-xl mb-2">Select Prompt Type</h2>
			<div className="flex justify-center gap-2 flex-wrap">
				{options.map((type) => (
					<button
						key={type}
						onClick={() => setFormatType(type)}
						className={`px-3 py-1 border rounded-full text-xs ${
							formatType === type ? 'bg-sky-600 text-white' : 'bg-gray-200'
						}`}
					>
						{type.charAt(0).toUpperCase() + type.slice(1)}
					</button>
				))}
			</div>
		</div>
	)
}
