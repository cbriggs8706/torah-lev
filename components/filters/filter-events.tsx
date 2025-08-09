'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const ALL_CATEGORIES = ['virtual', 'inperson', 'dinner', 'bookclub', 'feast']

export default function EventsFilter({
	initialCats = [],
	initialFrom = '',
	initialTo = '',
}: {
	initialCats?: string[]
	initialFrom?: string // yyyy-MM-dd
	initialTo?: string // yyyy-MM-dd
}) {
	const router = useRouter()
	const sp = useSearchParams()

	const [selected, setSelected] = useState<string[]>(initialCats)
	const [from, setFrom] = useState(initialFrom)
	const [to, setTo] = useState(initialTo)

	// keep inputs in sync with URL changes
	useEffect(() => {
		const cats = sp.getAll('cat')
		setSelected(cats.length ? cats : initialCats)
		setFrom(sp.get('from') ?? initialFrom)
		setTo(sp.get('to') ?? initialTo)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sp])

	function toggle(cat: string) {
		setSelected((prev) =>
			prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
		)
	}

	function apply() {
		const params = new URLSearchParams()
		selected.forEach((c) => params.append('cat', c))
		if (from) params.set('from', from)
		if (to) params.set('to', to)
		router.push(`/camerons-groups?${params.toString()}`)
	}

	function clearAll() {
		router.push('/camerons-groups') // server will reapply defaults
	}

	return (
		<div className="w-full mb-4 p-3 border rounded-md bg-white">
			{/* <div className="flex flex-wrap gap-2 mb-3">
				{ALL_CATEGORIES.map((cat) => (
					<button
						key={cat}
						onClick={() => toggle(cat)}
						className={`px-3 py-1 rounded border text-sm ${
							selected.includes(cat)
								? 'bg-sky-500 text-white border-sky-500'
								: 'bg-white text-sky-700 border-sky-500'
						}`}
					>
						{cat}
					</button>
				))}
			</div> */}

			<div className="flex gap-3 items-center">
				<label className="text-sm">
					From:{' '}
					<input
						type="date"
						value={from}
						onChange={(e) => setFrom(e.target.value)}
						className="border rounded px-2 py-1"
					/>
				</label>
				<label className="text-sm">
					To:{' '}
					<input
						type="date"
						value={to}
						onChange={(e) => setTo(e.target.value)}
						className="border rounded px-2 py-1"
					/>
				</label>
				<button
					onClick={apply}
					className="px-3 py-1 rounded bg-sky-500 text-white"
				>
					Apply
				</button>
				<button onClick={clearAll} className="px-3 py-1 rounded border">
					Clear
				</button>
			</div>
		</div>
	)
}
