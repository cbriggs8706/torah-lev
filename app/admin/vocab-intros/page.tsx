'use client'

import { useMemo, useState } from 'react'
import { useNotify } from 'react-admin'
import { vocabSourceChoices } from '@/lib/admin-vocab'

type VocabIntroRecord = {
	id: number
	sourceKey: string
	language: string
	entryId: number
	firstLesson: string
	lessonSort: string
	hebNiqqud: string | null
	heb: string | null
	grk: string | null
	eng: string | null
	introduction: string | null
}

function getDisplayWord(record: VocabIntroRecord) {
	return record.hebNiqqud || record.heb || record.grk || record.eng || '(untitled)'
}

export default function VocabIntroPage() {
	const notify = useNotify()
	const [sourceKey, setSourceKey] = useState('awb')
	const [lesson, setLesson] = useState('')
	const [missingOnly, setMissingOnly] = useState(true)
	const [loading, setLoading] = useState(false)
	const [saving, setSaving] = useState(false)
	const [records, setRecords] = useState<VocabIntroRecord[]>([])
	const [introValues, setIntroValues] = useState<Record<number, string>>({})
	const [pasteBlock, setPasteBlock] = useState('')

	const dirtyIds = useMemo(() => {
		return records
			.filter((record) => {
				const current = introValues[record.id] ?? ''
				const original = record.introduction ?? ''
				return current !== original
			})
			.map((record) => record.id)
	}, [introValues, records])

	const loadEntries = async () => {
		setLoading(true)
		try {
			const filter = {
				sourceKey,
				lesson,
				missingIntroduction: missingOnly,
			}
			const query = new URLSearchParams({
				sort: JSON.stringify(['lessonSort', 'ASC']),
				range: JSON.stringify([0, 999]),
				filter: JSON.stringify(filter),
			})

			const res = await fetch(`/api/vocab-entries?${query.toString()}`)
			if (!res.ok) throw new Error('Failed to load vocab entries')

			const data = (await res.json()) as VocabIntroRecord[]
			setRecords(data)
			setIntroValues(
				Object.fromEntries(
					data.map((record) => [record.id, record.introduction ?? ''])
				)
			)
		} catch (error) {
			notify('Could not load vocab entries', { type: 'error' })
		} finally {
			setLoading(false)
		}
	}

	const applyPasteBlock = () => {
		const values = pasteBlock
			.split(/\r?\n/)
			.map((line) => line.trim())
			.filter(Boolean)

		if (!values.length) {
			notify('Paste one URL per line first', { type: 'warning' })
			return
		}

		setIntroValues((prev) => {
			const next = { ...prev }
			records.forEach((record, index) => {
				if (index < values.length) {
					next[record.id] = values[index]
				}
			})
			return next
		})

		notify(`Applied ${Math.min(values.length, records.length)} URL(s)`, {
			type: 'info',
		})
	}

	const saveAll = async () => {
		const changedRecords = records.filter((record) => dirtyIds.includes(record.id))

		if (!changedRecords.length) {
			notify('No changes to save', { type: 'info' })
			return
		}

		setSaving(true)
		try {
			await Promise.all(
				changedRecords.map(async (record) => {
					const res = await fetch(`/api/vocab-entries/${record.id}`, {
						method: 'PUT',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							...record,
							introduction: introValues[record.id] ?? '',
						}),
					})

					if (!res.ok) {
						throw new Error(`Failed to save entry ${record.id}`)
					}
				})
			)

			setRecords((prev) =>
				prev.map((record) => ({
					...record,
					introduction: introValues[record.id] ?? '',
				}))
			)
			notify(`Saved ${changedRecords.length} vocab entr${changedRecords.length === 1 ? 'y' : 'ies'}`, {
				type: 'success',
			})
		} catch (error) {
			notify('Could not save all Introductory Video URLs', { type: 'error' })
		} finally {
			setSaving(false)
		}
	}

	return (
		<main className="mx-auto max-w-7xl p-6">
			<div className="sticky top-4 z-20 mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm">
				<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
					<div>
						<p className="font-semibold text-emerald-900">Save to database</p>
						<p className="text-sm text-emerald-800">
							Pasted URLs do not save automatically. Click save to write{' '}
							{dirtyIds.length} change{dirtyIds.length === 1 ? '' : 's'} to
							`vocab_entries`.
						</p>
					</div>
					<button
						type="button"
						onClick={saveAll}
						disabled={saving || dirtyIds.length === 0}
						className="rounded bg-emerald-700 px-5 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
					>
						{saving
							? 'Saving...'
							: dirtyIds.length === 0
							? 'Save All'
							: `Save ${dirtyIds.length} change${dirtyIds.length === 1 ? '' : 's'}`}
					</button>
				</div>
			</div>

			<div className="mb-6 flex flex-col gap-2">
				<h1 className="text-2xl font-bold">Vocab Intros</h1>
				<p className="text-sm text-gray-600">
					Filter vocab by source and lesson, paste one intro URL per line, then
					save everything at once.
				</p>
			</div>

			<div className="mb-6 grid gap-4 rounded-lg border bg-white p-4 md:grid-cols-4">
				<label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
					Source
					<select
						value={sourceKey}
						onChange={(e) => setSourceKey(e.target.value)}
						className="rounded border px-3 py-2 font-normal"
					>
						{vocabSourceChoices.map((choice) => (
							<option key={choice.id} value={choice.id}>
								{choice.name}
							</option>
						))}
					</select>
				</label>

				<label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
					Lesson
					<input
						value={lesson}
						onChange={(e) => setLesson(e.target.value)}
						placeholder="Example: 12 or 12a"
						className="rounded border px-3 py-2 font-normal"
					/>
				</label>

				<label className="flex items-center gap-2 pt-7 text-sm font-medium text-gray-700">
					<input
						type="checkbox"
						checked={missingOnly}
						onChange={(e) => setMissingOnly(e.target.checked)}
					/>
					Show only missing intro URLs
				</label>

				<div className="flex items-end">
					<button
						type="button"
						onClick={loadEntries}
						disabled={loading}
						className="rounded bg-sky-700 px-4 py-2 text-white disabled:opacity-50"
					>
						{loading ? 'Loading...' : 'Load vocab'}
					</button>
				</div>
			</div>

			<div className="mb-6 rounded-lg border bg-white p-4">
				<label className="mb-2 block text-sm font-medium text-gray-700">
					Bulk paste Introductory Video URLs
				</label>
				<textarea
					value={pasteBlock}
					onChange={(e) => setPasteBlock(e.target.value)}
					placeholder="Paste one URL per line. They will be applied top-to-bottom to the loaded rows."
					className="min-h-40 w-full rounded border px-3 py-2"
				/>
				<div className="mt-3 flex gap-3">
					<button
						type="button"
						onClick={applyPasteBlock}
						disabled={!records.length}
						className="rounded border border-gray-300 px-4 py-2 disabled:opacity-50"
					>
						Apply pasted URLs
					</button>
					<button
						type="button"
						onClick={saveAll}
						disabled={saving}
						className="rounded bg-emerald-700 px-4 py-2 text-white disabled:opacity-50"
					>
						{saving
							? 'Saving...'
							: dirtyIds.length === 0
							? 'Save All'
							: `Save ${dirtyIds.length} change${dirtyIds.length === 1 ? '' : 's'}`}
					</button>
				</div>
			</div>

			<div className="rounded-lg border bg-white">
				<div className="border-b px-4 py-3 text-sm text-gray-600">
					{records.length} vocab entr{records.length === 1 ? 'y' : 'ies'} loaded
				</div>
				<div className="overflow-x-auto">
					<table className="min-w-full text-left text-sm">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-4 py-3 font-medium text-gray-700">Lesson</th>
								<th className="px-4 py-3 font-medium text-gray-700">Word</th>
								<th className="px-4 py-3 font-medium text-gray-700">English</th>
								<th className="px-4 py-3 font-medium text-gray-700">
									Introductory Video URL
								</th>
							</tr>
						</thead>
						<tbody>
							{records.map((record) => {
								const currentValue = introValues[record.id] ?? ''
								const isDirty = currentValue !== (record.introduction ?? '')

								return (
									<tr key={record.id} className="border-t align-top">
										<td className="px-4 py-3">{record.firstLesson || '-'}</td>
										<td className="px-4 py-3 font-medium text-gray-900">
											{getDisplayWord(record)}
										</td>
										<td className="px-4 py-3 text-gray-600">
											{record.eng || '-'}
										</td>
										<td className="px-4 py-3">
											<input
												value={currentValue}
												onChange={(e) =>
													setIntroValues((prev) => ({
														...prev,
														[record.id]: e.target.value,
													}))
												}
												placeholder="https://..."
												className={`w-full rounded border px-3 py-2 ${
													isDirty
														? 'border-amber-400 bg-amber-50'
														: 'border-gray-300'
												}`}
											/>
										</td>
									</tr>
								)
							})}
							{records.length === 0 && !loading && (
								<tr>
									<td colSpan={4} className="px-4 py-8 text-center text-gray-500">
										No vocab entries match this filter yet.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
		</main>
	)
}
