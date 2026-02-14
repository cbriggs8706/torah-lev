'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'

interface CustomHebrewBookOption {
	id: number
	title: string
}

interface Props {
	customHebrewBooks: CustomHebrewBookOption[]
}

type Candidate = {
	source: 'BIBLICAL' | 'CUSTOM'
	id: string
	lemma: string
	consonants: string
}

type AnalyzedToken = {
	tokenKey: string
	surface: string
	consonants: string
	known: boolean
	candidates: Candidate[]
	selectedCandidate: Candidate | null
}

type AnalyzedVerse = {
	verseNumber: number
	text: string
	tokens: AnalyzedToken[]
}

type IngestAnalysis = {
	digest: string
	exactBibleMatch: boolean
	linkedHebrewBookId: number | null
	verseCount: number
	tokenCount: number
	knownTokenCount: number
	newTokenCount: number
	verses: AnalyzedVerse[]
}

type SegmentationOverrides = Record<string, string[]>

function encodeCandidate(c: Candidate): string {
	return `${c.source}:${c.id}`
}

function decodeCandidate(value: string): {
	source: 'BIBLICAL' | 'CUSTOM'
	id: string
} {
	const idx = value.indexOf(':')
	return {
		source: value.slice(0, idx) as 'BIBLICAL' | 'CUSTOM',
		id: value.slice(idx + 1),
	}
}

function analysisToSegmentationInputs(
	analysis: IngestAnalysis,
): Record<string, string> {
	const out: Record<string, string> = {}
	for (const verse of analysis.verses) {
		out[String(verse.verseNumber)] = verse.tokens
			.map((t) => t.surface)
			.join(' | ')
	}
	return out
}

function parseSegmentationOverrides(
	inputs: Record<string, string>,
	analysis: IngestAnalysis | null,
): SegmentationOverrides {
	if (!analysis) return {}

	const result: SegmentationOverrides = {}

	for (const verse of analysis.verses) {
		const key = String(verse.verseNumber)
		const raw = (inputs[key] ?? '').trim()
		if (!raw) continue

		const parts = raw
			.split('|')
			.map((p) => p.trim())
			.filter(Boolean)

		if (parts.length === 0) continue
		result[key] = parts
	}

	return result
}

export function CustomHebrewIngestForm({ customHebrewBooks }: Props) {
	const [customHebrewBookId, setCustomHebrewBookId] = useState('')
	const [chapterNumber, setChapterNumber] = useState('1')
	const [text, setText] = useState('')
	const [loading, setLoading] = useState(false)
	const [result, setResult] = useState<{
		status: 'IMPORTED' | 'SKIPPED_EXACT_MATCH'
		verseCount: number
		tokenCount: number
		knownTokenCount: number
		newTokenCount: number
		overrideCount: number
	} | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [analysis, setAnalysis] = useState<IngestAnalysis | null>(null)
	const [validationErrors, setValidationErrors] = useState<string[]>([])
	const [overrideSelections, setOverrideSelections] = useState<
		Record<string, string>
	>({})
	const [segmentationInputs, setSegmentationInputs] = useState<
		Record<string, string>
	>({})
	const [analyzedSegmentationOverrides, setAnalyzedSegmentationOverrides] =
		useState<SegmentationOverrides>({})

	const paragraphCount = useMemo(() => {
		return text
			.split(/\r?\n\s*\r?\n/)
			.map((p) => p.trim())
			.filter(Boolean).length
	}, [text])

	function resetAnalysis() {
		setAnalysis(null)
		setOverrideSelections({})
		setSegmentationInputs({})
		setAnalyzedSegmentationOverrides({})
		setResult(null)
	}

	function validateHebrewInput(value: string) {
		const errs: string[] = []
		const lines = value.split(/\r?\n/)
		lines.forEach((line, i) => {
			for (const ch of line) {
				const code = ch.charCodeAt(0)
				const isHebrew = code >= 0x0590 && code <= 0x05ff
				const isWhitespace = /\s/.test(ch)
				const isPunct = /[.,;:!?־׳״"'\-]/.test(ch)
				if (!isHebrew && !isWhitespace && !isPunct) {
					errs.push(
						`Line ${i + 1}: unexpected character "${ch}" (U+${code
							.toString(16)
							.toUpperCase()})`,
					)
				}
			}
		})
		setValidationErrors(errs)
		return errs.length === 0
	}

	async function runAnalyze(useManualSegmentation: boolean) {
		if (!text.trim()) {
			setError('Please enter some Hebrew text first.')
			return
		}

		const ok = validateHebrewInput(text)
		if (!ok) {
			setError('Please fix validation errors before analyzing.')
			return
		}

		if (!customHebrewBookId || !chapterNumber) {
			setError('Select a custom book and chapter number first.')
			return
		}

		setLoading(true)
		setError(null)
		setResult(null)
		setOverrideSelections({})

		const segmentationOverrides = useManualSegmentation
			? parseSegmentationOverrides(segmentationInputs, analysis)
			: {}

		try {
			const res = await fetch('/api/custom-hebrew-preview', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					customHebrewBookId: Number(customHebrewBookId),
					chapterNumber: Number(chapterNumber),
					rawText: text,
					segmentationOverrides,
				}),
			})
			const data = await res.json()
			if (!res.ok) {
				throw new Error(data?.error || 'Analyze failed')
			}
			setAnalysis(data.analysis)
			setSegmentationInputs(analysisToSegmentationInputs(data.analysis))
			setAnalyzedSegmentationOverrides(segmentationOverrides)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to analyze text')
		} finally {
			setLoading(false)
		}
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setLoading(true)
		setError(null)
		setResult(null)

		if (!analysis) {
			setLoading(false)
			setError('Run Analyze before importing.')
			return
		}

		const ok = validateHebrewInput(text)
		if (!ok) {
			setLoading(false)
			setError('Please fix validation errors before importing.')
			return
		}

		try {
			const overrides: Record<
				string,
				{ source: 'BIBLICAL' | 'CUSTOM'; id: string }
			> = {}

			for (const verse of analysis.verses) {
				for (const token of verse.tokens) {
					const selectedValue = overrideSelections[token.tokenKey]
					if (!selectedValue) continue

					const selected = decodeCandidate(selectedValue)
					const defaultValue = token.selectedCandidate
						? encodeCandidate(token.selectedCandidate)
						: ''
					if (defaultValue === selectedValue) continue

					overrides[token.tokenKey] = selected
				}
			}

			const res = await fetch('/api/custom-hebrew-ingest', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					customHebrewBookId: Number(customHebrewBookId),
					chapterNumber: Number(chapterNumber),
					rawText: text,
					analysisDigest: analysis.digest,
					overrides,
					segmentationOverrides: analyzedSegmentationOverrides,
				}),
			})

			const data = await res.json()
			if (!res.ok) {
				throw new Error(data?.error || 'Import failed')
			}

			setResult({
				status: data.status,
				verseCount: data.verseCount,
				tokenCount: data.tokenCount,
				knownTokenCount: data.knownTokenCount,
				newTokenCount: data.newTokenCount,
				overrideCount: data.overrideCount,
			})
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to import text')
		} finally {
			setLoading(false)
		}
	}

	return (
		<form
			onSubmit={handleSubmit}
			className="mx-auto flex max-w-4xl flex-col gap-4"
		>
			<h1 className="text-2xl font-semibold">Custom Hebrew Text Ingestion</h1>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<div className="flex flex-col gap-1">
					<label className="text-sm font-medium">Custom Book</label>
					<Select
						value={customHebrewBookId}
						onValueChange={(value) => {
							setCustomHebrewBookId(value)
							resetAnalysis()
						}}
					>
						<SelectTrigger>
							<SelectValue placeholder="Select a custom book" />
						</SelectTrigger>
						<SelectContent>
							{customHebrewBooks.map((b) => (
								<SelectItem key={b.id} value={String(b.id)}>
									{b.title}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="flex flex-col gap-1">
					<label className="text-sm font-medium">Chapter Number</label>
					<Input
						type="number"
						min={1}
						value={chapterNumber}
						onChange={(e) => {
							setChapterNumber(e.target.value)
							resetAnalysis()
						}}
					/>
				</div>
			</div>

			<div className="flex flex-col gap-1">
				<label className="text-sm font-medium">
					Hebrew Text (paragraphs become verses)
				</label>
				<Textarea
					dir="rtl"
					className="min-h-[220px] text-xl"
					placeholder="Paste chapter text here. Separate verses with a blank line."
					value={text}
					onChange={(e) => {
						setText(e.target.value)
						setError(null)
						resetAnalysis()
					}}
				/>
				<p className="text-xs text-muted-foreground">
					Detected verse paragraphs: {paragraphCount}
				</p>
			</div>

			{validationErrors.length > 0 && (
				<div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
					<ul className="list-disc list-inside">
						{validationErrors.map((msg, i) => (
							<li key={i}>{msg}</li>
						))}
					</ul>
				</div>
			)}

			<div className="flex items-center gap-3">
				<Button
					type="button"
					variant="outline"
					onClick={() => runAnalyze(false)}
					disabled={
						loading || !customHebrewBookId || !chapterNumber || !text.trim()
					}
				>
					{loading ? 'Analyzing…' : 'Analyze'}
				</Button>

				<Button
					type="button"
					variant="outline"
					onClick={() => runAnalyze(true)}
					disabled={
						loading ||
						!analysis ||
						!customHebrewBookId ||
						!chapterNumber ||
						!text.trim()
					}
				>
					{loading ? 'Reanalyzing…' : 'Reanalyze With Overrides'}
				</Button>

				<Button
					type="submit"
					disabled={
						loading ||
						!analysis ||
						!customHebrewBookId ||
						!chapterNumber ||
						!text.trim()
					}
				>
					{loading ? 'Importing…' : 'Confirm Import'}
				</Button>

				{error && <p className="text-sm text-red-600">{error}</p>}
			</div>

			{analysis && (
				<div className="rounded border p-3 text-sm">
					<h2 className="mb-2 font-semibold">Analyze Summary</h2>
					<div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
						<span>Verses: {analysis.verseCount}</span>
						<span>Tokens: {analysis.tokenCount}</span>
						<span>Existing: {analysis.knownTokenCount}</span>
						<span>New: {analysis.newTokenCount}</span>
					</div>
					{analysis.exactBibleMatch && (
						<p className="mt-2 rounded border border-amber-300 bg-amber-50 p-2 text-amber-700">
							This chapter exactly matches linked biblical text. Confirm Import
							will skip writing content and create an audit record.
						</p>
					)}

					<div className="mt-4 space-y-4" dir="rtl">
						{analysis.verses.map((verse) => (
							<div key={verse.verseNumber} className="rounded border p-2">
								<p className="mb-2 text-xs text-muted-foreground">
									Verse {verse.verseNumber}
								</p>
								<div className="mb-3 flex flex-col gap-1" dir="rtl">
									<label className="text-xs font-medium">
										Manual Segmentation ({'|'} separated tokens)
									</label>
									<Textarea
										value={segmentationInputs[String(verse.verseNumber)] ?? ''}
										className="min-h-[110px] text-3xl leading-relaxed"
										onChange={(e) =>
											setSegmentationInputs((prev) => ({
												...prev,
												[String(verse.verseNumber)]: e.target.value,
											}))
										}
									/>
								</div>
								<div className="flex flex-wrap items-center gap-2">
									{verse.tokens.map((token) => {
										const defaultValue = token.selectedCandidate
											? encodeCandidate(token.selectedCandidate)
											: ''
										const currentValue =
											overrideSelections[token.tokenKey] ?? defaultValue

										return (
											<div
												key={token.tokenKey}
												className={
													token.known
														? 'rounded border border-emerald-200 bg-emerald-50 px-2 py-1'
														: 'rounded border border-amber-300 bg-amber-50 px-2 py-1'
												}
											>
												<p className="text-lg">{token.surface}</p>
												<p className="text-[11px] text-muted-foreground">
													{token.consonants}
												</p>
												{token.candidates.length > 0 ? (
													<select
														className="mt-1 w-full rounded border bg-white px-1 py-0.5 text-xs"
														value={currentValue}
														onChange={(e) =>
															setOverrideSelections((prev) => ({
																...prev,
																[token.tokenKey]: e.target.value,
															}))
														}
													>
														{token.candidates.map((candidate) => (
															<option
																key={encodeCandidate(candidate)}
																value={encodeCandidate(candidate)}
															>
																{candidate.lemma} ({candidate.source})
															</option>
														))}
													</select>
												) : (
													<p className="mt-1 text-[11px] text-amber-700">
														Will create new custom lexeme
													</p>
												)}
											</div>
										)
									})}
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{result && (
				<div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
					<p className="font-semibold">
						{result.status === 'IMPORTED'
							? 'Import complete'
							: 'Import skipped (exact biblical match)'}
					</p>
					<p>
						Verses: {result.verseCount} | Tokens: {result.tokenCount} |
						Existing: {result.knownTokenCount} | New: {result.newTokenCount} |
						Overrides: {result.overrideCount}
					</p>
				</div>
			)}
		</form>
	)
}
