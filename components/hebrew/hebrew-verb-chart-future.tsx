'use client'

import {
	FutureConjugationRow,
	FutureConjugationTable,
} from '@/types/hebrew/verbs'
import React from 'react'

type Props = {
	data: FutureConjugationTable | null
}

export default function FutureVerbChart({ data }: Props) {
	if (!data || !data.rows || data.rows.length === 0)
		return (
			<p className="text-center text-neutral-500 mt-4">
				No future conjugation data found.
			</p>
		)

	// Group rows by person (1st, 2nd, 3rd)
	const grouped = {
		'1st': data.rows.filter((r) => r.person.startsWith('1')),
		'2nd': data.rows.filter((r) => r.person.startsWith('2')),
		'3rd': data.rows.filter((r) => r.person.startsWith('3')),
	}

	const renderHebrew = (row: FutureConjugationRow | undefined) =>
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

	const renderTranslit = (row: FutureConjugationRow | undefined) =>
		row ? (
			<div className="italic text-sm text-gray-600">
				{row.translit.map((t, i) => (
					<span key={i} className={t.class}>
						{t.text}
					</span>
				))}
			</div>
		) : null

	const renderEnglish = (row: FutureConjugationRow | undefined) =>
		row ? (
			<div className="text-sm font-nunito text-gray-800">
				{row.english.map((e, i) => (
					<span key={i} className={e.class}>
						{e.text}
					</span>
				))}
			</div>
		) : null

	const findRow = (prefix: string) => data.rows.find((r) => r.person === prefix)

	return (
		<div className="overflow-x-auto mt-6 border border-neutral-300 rounded-lg bg-white shadow-sm">
			<table className="w-full text-center border-collapse">
				<thead className="bg-sky-600 text-white">
					<tr>
						<th className="border p-3 w-1/6"></th>
						<th colSpan={2} className="border p-3 text-lg font-bold">
							Singular
						</th>
						<th colSpan={2} className="border p-3 text-lg font-bold">
							Plural
						</th>
					</tr>
					<tr className="bg-sky-400">
						<th className="border p-2 text-sm font-semibold">Person</th>
						<th className="border p-2 text-sm font-semibold">Masc</th>
						<th className="border p-2 text-sm font-semibold">Fem</th>
						<th className="border p-2 text-sm font-semibold">Masc</th>
						<th className="border p-2 text-sm font-semibold">Fem</th>
					</tr>
				</thead>
				<tbody>
					{Object.entries(grouped).map(([label, rows], i) => {
						const p = label[0] // "1", "2", "3"
						const r2ms = findRow(`${p}ms`)
						const r2fs = findRow(`${p}fs`)
						const r2mp = findRow(`${p}mp`)
						const r2fp = findRow(`${p}fp`)
						const r1sc = findRow('1sc')
						const r1pc = findRow('1pc')

						return (
							<tr key={i} className="odd:bg-white even:bg-neutral-50">
								<td className="border font-semibold p-2 text-sm">{label}</td>

								{/* Singular columns */}
								<td className="border p-2 align-top">
									{p === '1' ? renderHebrew(r1sc) : renderHebrew(r2ms)}
									{p === '1' ? renderTranslit(r1sc) : renderTranslit(r2ms)}
									{p === '1' ? renderEnglish(r1sc) : renderEnglish(r2ms)}
								</td>
								<td className="border p-2 align-top">
									{p === '1' ? (
										<div className="text-gray-300">—</div>
									) : (
										<>
											{renderHebrew(r2fs)}
											{renderTranslit(r2fs)}
											{renderEnglish(r2fs)}
										</>
									)}
								</td>

								{/* Plural columns */}
								<td className="border p-2 align-top">
									{p === '1' ? renderHebrew(r1pc) : renderHebrew(r2mp)}
									{p === '1' ? renderTranslit(r1pc) : renderTranslit(r2mp)}
									{p === '1' ? renderEnglish(r1pc) : renderEnglish(r2mp)}
								</td>
								<td className="border p-2 align-top">
									{p === '1' ? (
										<div className="text-gray-300">—</div>
									) : (
										<>
											{renderHebrew(r2fp)}
											{renderTranslit(r2fp)}
											{renderEnglish(r2fp)}
										</>
									)}
								</td>
							</tr>
						)
					})}
				</tbody>
			</table>
		</div>
	)
}
