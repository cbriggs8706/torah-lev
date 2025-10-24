'use client'

import React from 'react'
import {
	VayyiqtolConjugationTable,
	VayyiqtolConjugationRow,
} from '@/types/hebrew/verbs'

type Props = { data: VayyiqtolConjugationTable | null; title: string }

export default function HebrewVerbVayyiqtolCard({ data, title }: Props) {
	if (!data || !data.rows?.length) return null

	const find = (p: string) => data.rows.find((r) => r.person === p)

	const renderCell = (row?: VayyiqtolConjugationRow) =>
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
		<div className="bg-orange-50 rounded-xl shadow-xl p-4 mb-6 border-4 border-orange-600">
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-y-4 text-center">
				{/* Example Vayyiqtol-Tense layout */}
				<div>{renderCell(find('1sc'))}</div>
				<div>{renderCell(find('1pc'))}</div>
				<div>{renderCell(find('2ms'))}</div>
				<div>{renderCell(find('2fs'))}</div>
				<div>{renderCell(find('2mp'))}</div>
				<div>{renderCell(find('2fp'))}</div>
				<div>{renderCell(find('3ms'))}</div>
				<div>{renderCell(find('3fs'))}</div>
				<div>{renderCell(find('3mp'))}</div>
				<div>{renderCell(find('3fp'))}</div>
			</div>
		</div>
	)
}
