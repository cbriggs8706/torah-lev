'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeftRight, Search } from 'lucide-react'
import { useNotify } from 'react-admin'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { vocabSourceChoices } from '@/lib/admin-vocab'

type RelationKind = 'antonym' | 'synonym' | 'confused'
type Side = 'left' | 'right'

type VocabRelationSummary = {
	id: number
	sourceKey: string
	language: string
	lessons: string[]
	gloss: string | null
	lemma: string | null
	heb: string | null
	grk: string | null
	spa: string | null
	por: string | null
	category: string | null
	type: string | null
	displayWord: string
}

type VocabRelationDetail = VocabRelationSummary & {
	relatedEntryIds: string[]
	relatedEntries: VocabRelationSummary[]
}

const relationOptions: Array<{
	value: RelationKind
	label: string
	enabled: boolean
}> = [
	{ value: 'antonym', label: 'Antonyms', enabled: true },
	{ value: 'confused', label: 'Confused Words', enabled: true },
	{ value: 'synonym', label: 'Synonyms', enabled: false },
]

function getRelationLabel(kind: RelationKind) {
	if (kind === 'confused') return 'commonly confused words'
	if (kind === 'synonym') return 'synonyms'
	return 'antonyms'
}

function getPairButtonLabel(kind: RelationKind) {
	if (kind === 'confused') return 'Pair As Confused Words'
	if (kind === 'synonym') return 'Pair As Synonyms'
	return 'Pair As Antonyms'
}

function formatLessons(entry: { lessons: string[] }) {
	if (!entry.lessons.length) return 'No lesson assigned'
	return entry.lessons.join(', ')
}

function formatSubcopy(entry: VocabRelationSummary) {
	const parts = [
		entry.gloss,
		entry.heb && entry.heb !== entry.lemma ? entry.heb : null,
		entry.grk,
		entry.spa,
		entry.por,
	]
		.filter(Boolean)
		.map((value) => String(value))

	return parts.join(' • ')
}

function SearchColumn({
	title,
	query,
	onQueryChange,
	loading,
	results,
	selectedEntry,
	onSelect,
	side,
	kind,
}: {
	title: string
	query: string
	onQueryChange: (value: string) => void
	loading: boolean
	results: VocabRelationSummary[]
	selectedEntry: VocabRelationDetail | null
	onSelect: (entry: VocabRelationSummary, side: Side) => void
	side: Side
	kind: RelationKind
}) {
	return (
		<Card className="border-slate-200 shadow-sm">
			<CardHeader className="space-y-3">
				<div className="flex items-center justify-between gap-3">
					<CardTitle className="text-xl">{title}</CardTitle>
					{selectedEntry ? (
						<span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
							Selected
						</span>
					) : null}
				</div>
				<div className="space-y-2">
					<Label htmlFor={`${side}-search`}>Search vocab</Label>
					<div className="relative">
						<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
						<Input
							id={`${side}-search`}
							value={query}
							onChange={(event) => onQueryChange(event.target.value)}
							placeholder="Type ID, gloss, lemma, Hebrew, Greek, or lesson"
							className="h-11 rounded-xl border-slate-200 pl-10"
						/>
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{selectedEntry ? (
					<div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
						<div className="flex items-start justify-between gap-3">
							<div>
								<p className="text-lg font-semibold text-slate-900">
									{selectedEntry.displayWord}
								</p>
								<p className="mt-1 text-sm text-slate-600">
									{formatSubcopy(selectedEntry) || 'No alternate forms yet'}
								</p>
							</div>
							<span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
								#{selectedEntry.id}
							</span>
						</div>

						<div className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
							<p>
								<span className="font-semibold text-slate-900">Source:</span>{' '}
								{selectedEntry.sourceKey.toUpperCase()}
							</p>
							<p>
								<span className="font-semibold text-slate-900">Language:</span>{' '}
								{selectedEntry.language.toUpperCase()}
							</p>
							<p className="sm:col-span-2">
								<span className="font-semibold text-slate-900">Lessons:</span>{' '}
								{formatLessons(selectedEntry)}
							</p>
						</div>

						<div className="mt-4">
							<p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
								Current {getRelationLabel(kind)}
							</p>
							<div className="mt-2 flex flex-wrap gap-2">
								{selectedEntry.relatedEntries.length ? (
									selectedEntry.relatedEntries.map((entry) => (
										<span
											key={entry.id}
											className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700"
										>
											#{entry.id} {entry.displayWord}
										</span>
									))
								) : (
									<span className="text-sm text-slate-500">
										No {getRelationLabel(kind)} linked yet.
									</span>
								)}
							</div>
						</div>
					</div>
				) : (
					<div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
						Choose a vocab entry from the results below.
					</div>
				)}

				<div className="rounded-2xl border border-slate-200 bg-white">
					<div className="border-b border-slate-100 px-4 py-3">
						<p className="text-sm font-semibold text-slate-900">
							Search results
						</p>
						<p className="text-xs text-slate-500">
							{query.trim().length < 2
								? 'Type at least 2 characters to search.'
								: loading
									? 'Searching...'
									: `${results.length} result${results.length === 1 ? '' : 's'}`}
						</p>
					</div>
					<div className="max-h-[24rem] overflow-y-auto">
						{results.length ? (
							results.map((entry) => {
								const isSelected = selectedEntry?.id === entry.id
								return (
									<button
										key={entry.id}
										type="button"
										onClick={() => onSelect(entry, side)}
										className={cn(
											'flex w-full flex-col gap-1 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50',
											isSelected && 'bg-emerald-50 hover:bg-emerald-50',
										)}
									>
										<div className="flex items-center justify-between gap-3">
											<p className="font-medium text-slate-900">
												{entry.displayWord}
											</p>
											<span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
												#{entry.id}
											</span>
										</div>
										<p className="text-sm text-slate-600">
											{formatSubcopy(entry) || 'No alternate forms yet'}
										</p>
										<p className="text-xs uppercase tracking-[0.12em] text-slate-400">
											{entry.sourceKey.toUpperCase()} • {formatLessons(entry)}
										</p>
									</button>
								)
							})
						) : (
							<div className="px-4 py-8 text-center text-sm text-slate-500">
								{query.trim().length < 2
									? 'Start typing to find a vocab entry.'
									: loading
										? 'Searching...'
										: 'No vocab entries matched that search.'}
							</div>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	)
}

export default function VocabRelationsPage() {
	const notify = useNotify()
	const [sourceKey, setSourceKey] = useState('awb')
	const [kind, setKind] = useState<RelationKind>('antonym')
	const [leftQuery, setLeftQuery] = useState('')
	const [rightQuery, setRightQuery] = useState('')
	const [leftResults, setLeftResults] = useState<VocabRelationSummary[]>([])
	const [rightResults, setRightResults] = useState<VocabRelationSummary[]>([])
	const [leftLoading, setLeftLoading] = useState(false)
	const [rightLoading, setRightLoading] = useState(false)
	const [leftEntry, setLeftEntry] = useState<VocabRelationDetail | null>(null)
	const [rightEntry, setRightEntry] = useState<VocabRelationDetail | null>(null)
	const [saving, setSaving] = useState(false)

	const alreadyLinked = useMemo(() => {
		if (!leftEntry || !rightEntry) return false
		return leftEntry.relatedEntryIds.includes(String(rightEntry.id))
	}, [leftEntry, rightEntry])

	useEffect(() => {
		setLeftQuery('')
		setRightQuery('')
		setLeftResults([])
		setRightResults([])
		setLeftEntry(null)
		setRightEntry(null)
	}, [sourceKey])

	useEffect(() => {
		if (kind === 'synonym') {
			notify(
				'Synonym pairing is planned next. This screen currently supports antonyms and confused words.',
				{
					type: 'info',
				},
			)
			setKind('antonym')
		}
	}, [kind, notify])

	useEffect(() => {
		const controller = new AbortController()
		if (leftQuery.trim().length < 2) {
			setLeftResults([])
			setLeftLoading(false)
			return () => controller.abort()
		}

		setLeftLoading(true)
		const timeoutId = window.setTimeout(async () => {
			try {
				const params = new URLSearchParams({
					sourceKey,
					kind,
					q: leftQuery.trim(),
					limit: '12',
				})
				const response = await fetch(
					`/api/vocab-relations?${params.toString()}`,
					{
						signal: controller.signal,
					},
				)
				if (!response.ok) throw new Error('Failed to search vocab')
				const data = (await response.json()) as VocabRelationSummary[]
				setLeftResults(data)
			} catch (error) {
				if ((error as Error).name !== 'AbortError') {
					notify('Could not search the left vocab list', { type: 'error' })
				}
			} finally {
				setLeftLoading(false)
			}
		}, 250)

		return () => {
			controller.abort()
			window.clearTimeout(timeoutId)
		}
	}, [kind, leftQuery, notify, sourceKey])

	useEffect(() => {
		const controller = new AbortController()
		if (rightQuery.trim().length < 2) {
			setRightResults([])
			setRightLoading(false)
			return () => controller.abort()
		}

		setRightLoading(true)
		const timeoutId = window.setTimeout(async () => {
			try {
				const params = new URLSearchParams({
					sourceKey,
					kind,
					q: rightQuery.trim(),
					limit: '12',
				})
				const response = await fetch(
					`/api/vocab-relations?${params.toString()}`,
					{
						signal: controller.signal,
					},
				)
				if (!response.ok) throw new Error('Failed to search vocab')
				const data = (await response.json()) as VocabRelationSummary[]
				setRightResults(data)
			} catch (error) {
				if ((error as Error).name !== 'AbortError') {
					notify('Could not search the right vocab list', { type: 'error' })
				}
			} finally {
				setRightLoading(false)
			}
		}, 250)

		return () => {
			controller.abort()
			window.clearTimeout(timeoutId)
		}
	}, [kind, notify, rightQuery, sourceKey])

	const loadEntryDetail = async (entry: VocabRelationSummary) => {
		const params = new URLSearchParams({
			sourceKey: entry.sourceKey,
			kind,
			rowId: String(entry.id),
		})
		const response = await fetch(`/api/vocab-relations?${params.toString()}`)
		if (!response.ok) {
			throw new Error('Failed to load entry')
		}
		return (await response.json()) as VocabRelationDetail
	}

	const handleSelectEntry = async (entry: VocabRelationSummary, side: Side) => {
		try {
			const detail = await loadEntryDetail(entry)
			if (side === 'left') {
				setLeftEntry(detail)
				setLeftQuery(entry.displayWord)
			} else {
				setRightEntry(detail)
				setRightQuery(entry.displayWord)
			}
		} catch (error) {
			notify('Could not load that vocab entry', { type: 'error' })
		}
	}

	const handleCreatePair = async () => {
		if (!leftEntry || !rightEntry) {
			notify('Choose two vocab entries first', { type: 'warning' })
			return
		}

		setSaving(true)
		try {
			const response = await fetch('/api/vocab-relations', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					sourceKey,
					leftId: leftEntry.id,
					rightId: rightEntry.id,
					kind,
				}),
			})

			if (!response.ok) {
				throw new Error(await response.text())
			}

			const [freshLeft, freshRight] = await Promise.all([
				loadEntryDetail(leftEntry),
				loadEntryDetail(rightEntry),
			])
			setLeftEntry(freshLeft)
			setRightEntry(freshRight)

			notify(
				`Paired #${leftEntry.id} and #${rightEntry.id} as ${getRelationLabel(kind)}`,
				{ type: 'success' },
			)
		} catch (error) {
			notify(
				error instanceof Error
					? error.message
					: `Could not save ${getRelationLabel(kind)} pair`,
				{ type: 'error' },
			)
		} finally {
			setSaving(false)
		}
	}

	return (
		<main className="mx-auto max-w-7xl p-6">
			<div className="mb-8 flex flex-col gap-3">
				<p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
					Admin vocab tools
				</p>
				<h1 className="text-3xl font-semibold text-slate-950">
					Vocab Relations
				</h1>
				<p className="max-w-3xl text-sm leading-6 text-slate-600">
					Search for two vocab entries from the same source, inspect their
					current relations, and save the pair symmetrically in one step.
				</p>
			</div>

			<Card className="mb-6 border-slate-200 bg-gradient-to-r from-amber-50 via-white to-emerald-50 shadow-sm">
				<CardContent className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
					<div className="grid gap-4 md:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
						<div className="space-y-2">
							<Label htmlFor="source-select">Source</Label>
							<select
								id="source-select"
								value={sourceKey}
								onChange={(event) => setSourceKey(event.target.value)}
								className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-slate-300"
							>
								{vocabSourceChoices.map((choice) => (
									<option key={choice.id} value={choice.id}>
										{choice.name}
									</option>
								))}
							</select>
						</div>

						<div className="space-y-2">
							<Label>Relation type</Label>
							<div className="flex flex-wrap gap-2">
								{relationOptions.map((option) => (
									<button
										key={option.value}
										type="button"
										onClick={() => option.enabled && setKind(option.value)}
										disabled={!option.enabled}
										className={cn(
											'rounded-full border px-4 py-2 text-sm font-semibold transition',
											kind === option.value
												? 'border-emerald-700 bg-emerald-700 text-white'
												: 'border-slate-200 bg-white text-slate-700',
											!option.enabled && 'cursor-not-allowed opacity-60',
										)}
									>
										{option.label}
										{!option.enabled ? ' (Soon)' : ''}
									</button>
								))}
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			<div className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_4.5rem_minmax(0,1fr)]">
				<SearchColumn
					title="Entry A"
					query={leftQuery}
					onQueryChange={setLeftQuery}
					loading={leftLoading}
					results={leftResults}
					selectedEntry={leftEntry}
					onSelect={handleSelectEntry}
					side="left"
					kind={kind}
				/>

				<div className="hidden items-center justify-center xl:flex">
					<div className="rounded-full border border-slate-200 bg-white p-4 shadow-sm">
						<ArrowLeftRight className="size-6 text-slate-500" />
					</div>
				</div>

				<SearchColumn
					title="Entry B"
					query={rightQuery}
					onQueryChange={setRightQuery}
					loading={rightLoading}
					results={rightResults}
					selectedEntry={rightEntry}
					onSelect={handleSelectEntry}
					side="right"
					kind={kind}
				/>
			</div>

			<Alert className="border-slate-200 bg-white shadow-sm">
				<AlertTitle className="text-slate-900">Ready to save</AlertTitle>
				<AlertDescription className="space-y-4">
					<p className="text-slate-600">
						This will update both vocab entries so each one lists the other as a{' '}
						{kind === 'confused' ? 'commonly confused word' : getRelationLabel(kind).slice(0, -1)}.
					</p>
					<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
						<div className="text-sm text-slate-600">
							{leftEntry && rightEntry ? (
								<span>
									#{leftEntry.id} {leftEntry.displayWord} ↔ #{rightEntry.id}{' '}
									{rightEntry.displayWord}
								</span>
							) : (
								<span>Select both entries to enable pairing.</span>
							)}
						</div>
						<Button
							type="button"
							variant="primary"
							onClick={handleCreatePair}
							disabled={!leftEntry || !rightEntry || saving || alreadyLinked}
						>
							{alreadyLinked
								? 'Already Paired'
								: saving
									? 'Saving Pair...'
									: getPairButtonLabel(kind)}
						</Button>
					</div>
				</AlertDescription>
			</Alert>
		</main>
	)
}
