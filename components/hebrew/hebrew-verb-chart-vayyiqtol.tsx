'use client'

import React from 'react'
import {
	VayyiqtolConjugationTable,
	VayyiqtolConjugationRow,
} from '@/types/hebrew/verbs'

type Props = {
	data: VayyiqtolConjugationTable | null
}

export default function HebrewVayyiqtolVerbChart({ data }: Props) {
	if (!data || !data.rows || data.rows.length === 0)
		return (
			<p className="text-center text-neutral-500 mt-4">
				No vayyiqtol conjugation data found.
			</p>
		)

	// Group by person for display
	const grouped = {
		'1st': data.rows.filter((r) => r.person.startsWith('1')),
		'2nd': data.rows.filter((r) => r.person.startsWith('2')),
		'3rd': data.rows.filter((r) => r.person.startsWith('3')),
	}

	const renderHebrew = (row?: VayyiqtolConjugationRow) =>
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

	const renderTranslit = (row?: VayyiqtolConjugationRow) =>
		row ? (
			<div className="italic text-sm text-gray-600">
				{row.translit.map((t, i) => (
					<span key={i} className={t.class}>
						{t.text}
					</span>
				))}
			</div>
		) : null

	const renderEnglish = (row?: VayyiqtolConjugationRow) =>
		row ? (
			<div className="text-sm font-nunito text-gray-800">
				{row.english.map((e, i) => (
					<span key={i} className={e.class}>
						{e.text}
					</span>
				))}
			</div>
		) : null

	const findRow = (person: string) => data.rows.find((r) => r.person === person)

	return (
		<div className="overflow-x-auto mt-6 border border-neutral-300 rounded-lg bg-white shadow-sm">
			<table className="w-full text-center border-collapse">
				<thead className="bg-orange-600 text-white">
					<tr>
						<th className="border p-3 w-1/6"></th>
						<th colSpan={2} className="border p-3 text-lg font-bold">
							Singular
						</th>
						<th colSpan={2} className="border p-3 text-lg font-bold">
							Plural
						</th>
					</tr>
					<tr className="bg-orange-400">
						<th className="border p-2 text-sm font-semibold">Person</th>
						<th className="border p-2 text-sm font-semibold">Masc</th>
						<th className="border p-2 text-sm font-semibold">Fem</th>
						<th className="border p-2 text-sm font-semibold">Masc</th>
						<th className="border p-2 text-sm font-semibold">Fem</th>
					</tr>
				</thead>
				<tbody>
					{Object.entries(grouped).map(([label], i) => {
						const p = label[0] // "1", "2", or "3"

						const r1sc = findRow('1sc')
						const r1pc = findRow('1pc')

						const r2ms = findRow('2ms')
						const r2fs = findRow('2fs')
						const r2mp = findRow('2mp')
						const r2fp = findRow('2fp')

						const r3ms = findRow('3ms')
						const r3fs = findRow('3fs')
						const r3mp = findRow('3mp')
						const r3fp = findRow('3fp')

						return (
							<tr key={i} className="odd:bg-white even:bg-neutral-50">
								<td className="border font-semibold p-2 text-sm">{label}</td>

								{/* Singular columns */}
								<td className="border p-2 align-top">
									{p === '1'
										? renderHebrew(r1sc)
										: p === '2'
										? renderHebrew(r2ms)
										: renderHebrew(r3ms)}
									{p === '1'
										? renderTranslit(r1sc)
										: p === '2'
										? renderTranslit(r2ms)
										: renderTranslit(r3ms)}
									{p === '1'
										? renderEnglish(r1sc)
										: p === '2'
										? renderEnglish(r2ms)
										: renderEnglish(r3ms)}
								</td>
								<td className="border p-2 align-top">
									{p === '1' ? (
										<div className="text-gray-300">—</div>
									) : p === '2' ? (
										<>
											{renderHebrew(r2fs)}
											{renderTranslit(r2fs)}
											{renderEnglish(r2fs)}
										</>
									) : (
										<>
											{renderHebrew(r3fs)}
											{renderTranslit(r3fs)}
											{renderEnglish(r3fs)}
										</>
									)}
								</td>

								{/* Plural columns */}
								<td className="border p-2 align-top">
									{p === '1'
										? renderHebrew(r1pc)
										: p === '2'
										? renderHebrew(r2mp)
										: renderHebrew(r3mp)}
									{p === '1'
										? renderTranslit(r1pc)
										: p === '2'
										? renderTranslit(r2mp)
										: renderTranslit(r3mp)}
									{p === '1'
										? renderEnglish(r1pc)
										: p === '2'
										? renderEnglish(r2mp)
										: renderEnglish(r3mp)}
								</td>
								<td className="border p-2 align-top">
									{p === '1' ? (
										<div className="text-gray-300">—</div>
									) : p === '2' ? (
										<>
											{renderHebrew(r2fp)}
											{renderTranslit(r2fp)}
											{renderEnglish(r2fp)}
										</>
									) : (
										<>
											{renderHebrew(r3fp)}
											{renderTranslit(r3fp)}
											{renderEnglish(r3fp)}
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
