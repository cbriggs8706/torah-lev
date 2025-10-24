'use client'

import React from 'react'
import {
	InfinitiveConjugationTable,
	InfinitiveConjugationRow,
} from '@/types/hebrew/verbs'
import { Male, Female } from '@mui/icons-material'

type Props = {
	data: InfinitiveConjugationTable | null
}

export default function HebrewInfinitiveVerbChart({ data }: Props) {
	if (!data || !data.rows || data.rows.length === 0)
		return (
			<p className="text-center text-neutral-500 mt-4">
				No infinitive conjugation data found.
			</p>
		)

	// There should only be one row (infinitive form)
	const row: InfinitiveConjugationRow = data.rows[0]

	const renderHebrew = (r: InfinitiveConjugationRow) => (
		<div className="font-serif text-4xl leading-snug text-center">
			{r.hebrew.map((h, i) => (
				<span key={i} className={h.class}>
					{h.char}
				</span>
			))}
		</div>
	)

	const renderTranslit = (r: InfinitiveConjugationRow) => (
		<div className="italic text-sm text-gray-600">
			{r.translit.map((t, i) => (
				<span key={i} className={t.class}>
					{t.text}
				</span>
			))}
		</div>
	)

	const renderEnglish = (r: InfinitiveConjugationRow) => (
		<div className="text-sm font-nunito text-gray-800">
			{r.english.map((e, i) => (
				<span key={i} className={e.class}>
					{e.text}
				</span>
			))}
		</div>
	)

	return (
		<div className="overflow-x-auto mt-6 border border-neutral-300 rounded-lg bg-white shadow-xl">
			<table className="w-full text-center border-collapse">
				<thead className="bg-red-600 text-white">
					<tr>
						<th className="border p-3 w-1/6"></th>
						<th colSpan={2} className="border p-3 text-lg font-bold">
							Singular
						</th>
						<th colSpan={2} className="border p-3 text-lg font-bold">
							Plural
						</th>
					</tr>
					<tr className="bg-red-400">
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
						<td className="border p-3 align-top text-center" colSpan={4}>
							{renderHebrew(row)}
							{renderTranslit(row)}
							{renderEnglish(row)}
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	)
}
