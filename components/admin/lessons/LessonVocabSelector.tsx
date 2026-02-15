'use client'

import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'

type VocabItem = {
	vocabTermId: string
	surfaceInScript: string
	consonants: string
	frequency: number
	biblicalLemma: string | null
	customLemma: string | null
	selected: boolean
}

export function LessonVocabSelector({
	lessonId,
	lessonSlug,
	items,
}: {
	lessonId: string
	lessonSlug: string
	items: VocabItem[]
}) {
	const [search, setSearch] = useState('')
	const [selectedIds, setSelectedIds] = useState<Set<string>>(
		new Set(items.filter((item) => item.selected).map((item) => item.vocabTermId)),
	)
	const [loading, setLoading] = useState(false)
	const [message, setMessage] = useState<string | null>(null)
	const [error, setError] = useState<string | null>(null)

	const filteredItems = useMemo(() => {
		const q = search.trim().toLowerCase()
		if (!q) return items
		return items.filter((item) => {
			return (
				item.surfaceInScript.toLowerCase().includes(q) ||
				item.consonants.toLowerCase().includes(q) ||
				(item.biblicalLemma ?? '').toLowerCase().includes(q) ||
				(item.customLemma ?? '').toLowerCase().includes(q)
			)
		})
	}, [items, search])

	function toggle(vocabTermId: string, checked: boolean) {
		setSelectedIds((prev) => {
			const next = new Set(prev)
			if (checked) next.add(vocabTermId)
			else next.delete(vocabTermId)
			return next
		})
	}

	async function saveSelections() {
		setLoading(true)
		setMessage(null)
		setError(null)

		try {
			const vocabTermIds = [...selectedIds]
			const res = await fetch(`/api/admin/lessons/${lessonId}/new-vocab`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ vocabTermIds }),
			})
			const data = await res.json()
			if (!res.ok) {
				throw new Error(data?.error || 'Failed to save selections')
			}
			setMessage(`Saved ${data.selectedCount} new vocab words.`)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to save selections')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
			<div className="space-y-1">
				<h1 className="text-2xl font-semibold">Lesson Vocab Review</h1>
				<p className="text-sm text-muted-foreground">
					Lesson: {lessonSlug}. Select the vocab words that are new in this lesson.
				</p>
			</div>

			<div className="flex flex-wrap gap-2">
				<Input
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Search vocab..."
					className="max-w-sm"
				/>
				<Button disabled={loading} onClick={saveSelections}>
					{loading ? 'Saving...' : 'Save New Vocab Selection'}
				</Button>
			</div>

			<div className="max-h-[540px] overflow-auto rounded-md border">
				<table className="w-full text-sm">
					<thead className="sticky top-0 bg-background">
						<tr className="border-b">
							<th className="w-12 p-3 text-left">New</th>
							<th className="p-3 text-left">Surface</th>
							<th className="p-3 text-left">Consonants</th>
							<th className="p-3 text-left">Frequency</th>
							<th className="p-3 text-left">Lexeme</th>
						</tr>
					</thead>
					<tbody>
						{filteredItems.map((item) => {
							const checked = selectedIds.has(item.vocabTermId)
							return (
								<tr key={item.vocabTermId} className="border-b">
									<td className="p-3">
										<Checkbox
											checked={checked}
											onCheckedChange={(value) =>
												toggle(item.vocabTermId, value === true)
											}
										/>
									</td>
									<td className="p-3 text-lg">{item.surfaceInScript}</td>
									<td className="p-3">{item.consonants}</td>
									<td className="p-3">{item.frequency}</td>
									<td className="p-3">
										{item.biblicalLemma ?? item.customLemma ?? '-'}
									</td>
								</tr>
							)
						})}
					</tbody>
				</table>
			</div>

			{message ? <p className="text-sm text-green-700">{message}</p> : null}
			{error ? <p className="text-sm text-red-600">{error}</p> : null}
		</div>
	)
}
