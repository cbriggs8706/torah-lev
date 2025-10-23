'use client'

import React from 'react'

// Define Row type to structure each row data
type Row = {
	person: string
	gender: string
	number: string
	hebrew: string
	translit: string
	english: string
}

type TenseData = {
	strongs: number
	tense: string
	rows: Row[]
}

const HebrewVerbChart = ({
	tenseData,
	tense,
}: {
	tenseData: TenseData
	tense: string
}) => {
	if (!tenseData || !tenseData.rows) {
		return (
			<div className="w-full max-w-4xl mx-auto my-8 p-4 border-2 rounded-xl bg-white shadow-md">
				<h2 className="text-2xl font-semibold mb-4">{tense} Tense</h2>
				<p>No data available for this tense.</p>
			</div>
		)
	}

	return (
		<div className="w-full max-w-4xl mx-auto my-8 p-4 border-2 rounded-xl bg-white shadow-md">
			<h2 className="text-2xl font-semibold mb-4">{tense} Tense</h2>

			<div className="overflow-x-auto">
				<table className="min-w-full border-collapse text-sm md:text-base">
					<thead className="bg-gray-100 text-gray-700 text-center">
						<tr>
							<th className="w-24 border p-2"></th>
							<th colSpan={2} className="border p-2">
								Singular
							</th>
							<th colSpan={2} className="border p-2">
								Plural
							</th>
						</tr>
						<tr>
							<th className="border p-2 text-left">Person</th>
							<th className="border p-2">Masc.</th>
							<th className="border p-2">Fem.</th>
							<th className="border p-2">Masc.</th>
							<th className="border p-2">Fem.</th>
						</tr>
					</thead>
					<tbody>
						{tenseData.rows.map((row, index) => (
							<tr key={index} className="border-t border-gray-200">
								<td className="p-2 font-semibold">{row.person}</td>
								<td className="p-2 text-center">
									<RenderRow row={row} gender="m" number="s" />
								</td>
								<td className="p-2 text-center">
									<RenderRow row={row} gender="f" number="s" />
								</td>
								<td className="p-2 text-center">
									<RenderRow row={row} gender="m" number="p" />
								</td>
								<td className="p-2 text-center">
									<RenderRow row={row} gender="f" number="p" />
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	)
}

function RenderRow({
	row,
	gender,
	number,
}: {
	row: Row
	gender: string
	number: string
}) {
	const matchingRow =
		row.gender === gender && row.number === number ? row : null

	return (
		<div className="leading-tight">
			<div className="font-hebrew text-xl">
				{matchingRow ? matchingRow.hebrew : '-'}
			</div>
			<div className="italic text-gray-600 text-sm">
				{matchingRow ? matchingRow.translit : '-'}
			</div>
			<div className="text-gray-700 text-xs">
				{matchingRow ? matchingRow.english : '-'}
			</div>
		</div>
	)
}

export default HebrewVerbChart
