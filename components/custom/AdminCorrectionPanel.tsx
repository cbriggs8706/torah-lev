// components/custom/AdminCorrectionPanel.tsx

'use client'

import { useState } from 'react'
import { findCandidates } from '@/lib/hebrew/findCandidates'

/* ----------------------------------------
   TYPES
----------------------------------------- */

export interface Candidate {
	id: string
	surface: string
	lemma: string | null
}

export interface CandidateResults {
	exact: Candidate[]
	strip: Candidate[]
	lemma: Candidate[]
}

interface AdminCorrectionPanelProps {
	segment: string
	onSave: (newSurface: string) => void
}

/* ----------------------------------------
   COMPONENT
----------------------------------------- */

export default function AdminCorrectionPanel({
	segment,
	onSave,
}: AdminCorrectionPanelProps) {
	const [query, setQuery] = useState<string>(segment)
	const [results, setResults] = useState<CandidateResults | null>(null)

	async function search() {
		const r = await findCandidates(query)
		setResults(r)
	}

	function selectCandidate(c: Candidate) {
		onSave(c.surface)
	}

	return (
		<div className="p-4 border rounded">
			<h2 className="font-bold mb-2">Fix segment:</h2>

			<input
				className="border p-2 w-full"
				value={query}
				onChange={(e) => setQuery(e.target.value)}
			/>

			<button className="btn mt-2" onClick={search}>
				Search Database
			</button>

			{results && (
				<div className="mt-3 space-y-4">
					{(Object.keys(results) as Array<keyof CandidateResults>).map(
						(type) => (
							<div key={type}>
								<h3 className="font-semibold capitalize">{type} matches</h3>

								{results[type].length === 0 && (
									<div className="text-gray-500 text-sm">No matches</div>
								)}

								{results[type].map((r) => (
									<div
										key={r.id}
										className="cursor-pointer hover:bg-gray-100 p-1"
										onClick={() => selectCandidate(r)}
									>
										{r.surface} — {r.lemma ?? '—'}
									</div>
								))}
							</div>
						)
					)}
				</div>
			)}
		</div>
	)
}
