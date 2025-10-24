'use client'

import React from 'react'
import {
	ImperativeConjugationTable,
	ImperativeConjugationRow,
} from '@/types/hebrew/verbs'
import { Male, Female } from '@mui/icons-material'

type Props = {
	data: ImperativeConjugationTable | null
}

export default function HebrewImperativeVerbChart({ data }: Props) {
	if (!data || !data.rows || data.rows.length === 0)
		return (
			<p className="text-center text-neutral-500 mt-4">
				No imperative conjugation data found.
			</p>
		)

	const renderHebrew = (row?: ImperativeConjugationRow) =>
		row ? (
			<div className="font-serif text-4xl leading-snug text-center">
				{row.hebrew.map((h, i) => (
					<span key={i} className={h.class}>
						{h.char}
					</span>
				))}
			</div>
		) : (
			<div className="text-gray-300">—</div>
		)

	const renderTranslit = (row?: ImperativeConjugationRow) =>
		row ? (
			<div className="italic text-sm text-gray-600">
				{row.translit.map((t, i) => (
					<span key={i} className={t.class}>
						{t.text}
					</span>
				))}
			</div>
		) : null

	const renderEnglish = (row?: ImperativeConjugationRow) =>
		row ? (
			<div className="text-sm font-nunito text-gray-800">
				{row.english.map((e, i) => (
					<span key={i} className={e.class}>
						{e.text}
					</span>
				))}
			</div>
		) : null

	const findRow = (gender: 'm' | 'f', number: 's' | 'p') =>
		data.rows.find((r) => r.gender === gender && r.number === number)

	const ms = findRow('m', 's')
	const fs = findRow('f', 's')
	const mp = findRow('m', 'p')
	const fp = findRow('f', 'p')

	return (
		<div className="overflow-x-auto mt-6 border border-neutral-300 rounded-lg bg-white shadow-xl">
			<table className="w-full text-center border-collapse">
				<thead className="bg-purple-600 text-white">
					<tr>
						<th className="border p-3 w-1/6"></th>
						<th colSpan={2} className="border p-3 text-lg font-bold">
							Singular
						</th>
						<th colSpan={2} className="border p-3 text-lg font-bold">
							Plural
						</th>
					</tr>
					<tr className="bg-purple-400">
						<th className="border p-2 text-sm font-semibold">Person</th>
						<th className="border p-2 text-sm font-semibold">
							<Male />
						</th>
						<th className="border p-2 text-sm font-semibold">
							<Female />
						</th>
						<th className="border p-2 text-sm font-semibold">
							<Male />
							<Male />
						</th>
						<th className="border p-2 text-sm font-semibold">
							<Female />
							<Female />
						</th>
					</tr>
				</thead>
				<tbody>
					<tr className="odd:bg-white even:bg-neutral-50">
						<td className="border font-semibold p-2 text-sm">All</td>

						{/* Singular masculine */}
						<td className="border p-2 align-top">
							{renderHebrew(ms)}
							{renderTranslit(ms)}
							{renderEnglish(ms)}
						</td>

						{/* Singular feminine */}
						<td className="border p-2 align-top">
							{renderHebrew(fs)}
							{renderTranslit(fs)}
							{renderEnglish(fs)}
						</td>

						{/* Plural masculine */}
						<td className="border p-2 align-top">
							{renderHebrew(mp)}
							{renderTranslit(mp)}
							{renderEnglish(mp)}
						</td>

						{/* Plural feminine */}
						<td className="border p-2 align-top">
							{renderHebrew(fp)}
							{renderTranslit(fp)}
							{renderEnglish(fp)}
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	)
}
