'use client'

import { Dispatch, SetStateAction } from 'react'

interface LanguageFilterProps {
	selectedLang: 'spa' | 'por'
	setSelectedLang: Dispatch<SetStateAction<'spa' | 'por'>>
}

export default function LanguageFilter({
	selectedLang,
	setSelectedLang,
}: LanguageFilterProps) {
	return (
		<div className="space-y-3 mb-4">
			<h2 className="text-xl font-semibold">Select Language</h2>
			<div className="flex flex-wrap justify-center gap-2">
				<button
					onClick={() => setSelectedLang('spa')}
					className={`px-3 py-1 border rounded-full text-xs ${
						selectedLang === 'spa' ? 'bg-blue-500 text-white' : 'bg-gray-200'
					}`}
				>
					Spanish
				</button>
				<button
					onClick={() => setSelectedLang('por')}
					className={`px-3 py-1 border rounded-full text-xs ${
						selectedLang === 'por' ? 'bg-blue-500 text-white' : 'bg-gray-200'
					}`}
				>
					Portuguese
				</button>
			</div>
		</div>
	)
}
