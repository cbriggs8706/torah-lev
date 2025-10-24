'use client'

import React from 'react'
import {
	InfinitiveConjugationTable,
	InfinitiveConjugationRow,
} from '@/types/hebrew/verbs'

type Props = { data: InfinitiveConjugationTable | null; title: string }

export default function HebrewVerbInfinitiveCard({ data, title }: Props) {
	if (!data || !data.rows?.length) return null

	// Since there's only one entry, directly access the first row
	const row = data.rows[0]

	const renderCell = (row: InfinitiveConjugationRow) => (
		<div className="flex flex-col items-center">
			<div className="font-serif text-3xl sm:text-4xl text-center">
				{row.hebrew.map((h, i) => (
					<span key={i}>{h.char}</span>
				))}
			</div>
			<div className="italic text-xs sm:text-sm text-red-600">
				{row.translit.map((t, i) => (
					<span key={i}>{t.text}</span>
				))}
			</div>
			<div className="text-[11px] sm:text-sm text-gray-700">
				{row.english.map((e, i) => (
					<span key={i}>{e.text}</span>
				))}
			</div>
		</div>
	)

	return (
		<div className="bg-red-50 rounded-xl shadow-xl p-4 mb-6 border-4 border-red-600">
			<div className="text-center mb-4">
				<h3 className="text-2xl font-semibold text-sky-800 mb-2">{title}</h3>
			</div>

			{/* Render the only row directly */}
			<div>{renderCell(row)}</div>
		</div>
	)
}
