'use client'

import React from 'react'
import {
	ImperativeConjugationTable,
	ImperativeConjugationRow,
} from '@/types/hebrew/verbs'

type Props = { data: ImperativeConjugationTable | null; title: string }

export default function HebrewVerbImperativeCard({ data, title }: Props) {
	if (!data || !data.rows?.length) return null

	// Function to render each conjugation row
	const renderCell = (row?: ImperativeConjugationRow) =>
		row ? (
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
		) : (
			<div className="text-gray-300">—</div>
		)

	return (
		<div className="bg-purple-100 rounded-xl shadow-xl p-4 mb-6 border-4 border-purple-600">
			<div className="text-center mb-4">
				<h3 className="text-2xl font-semibold text-sky-800 mb-2">{title}</h3>
			</div>

			{/* Render all conjugation rows */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
				{data.rows.map((row, index) => (
					<div key={index}>{renderCell(row)}</div>
				))}
			</div>
		</div>
	)
}
