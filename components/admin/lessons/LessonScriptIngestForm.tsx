'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

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

type LessonScriptAnalysis = {
	digest: string
	verseCount: number
	tokenCount: number
	knownTokenCount: number
	newTokenCount: number
	vocabCount: number
	verses: AnalyzedVerse[]
}

type SegmentationOverrides = Record<string, string[]>

function encodeCandidate(candidate: Candidate): string {
	return `${candidate.source}:${candidate.id}`
}

function decodeCandidate(value: string): { source: 'BIBLICAL' | 'CUSTOM'; id: string } {
	const idx = value.indexOf(':')
	return {
		source: value.slice(0, idx) as 'BIBLICAL' | 'CUSTOM',
		id: value.slice(idx + 1),
	}
}

function analysisToSegmentationInputs(analysis: LessonScriptAnalysis): Record<string, string> {
	const out: Record<string, string> = {}
	for (const verse of analysis.verses) {
		out[String(verse.verseNumber)] = verse.tokens.map((token) => token.surface).join(' | ')
	}
	return out
}

function parseSegmentationOverrides(
	inputs: Record<string, string>,
	analysis: LessonScriptAnalysis | null,
): SegmentationOverrides {
	if (!analysis) return {}

	const result: SegmentationOverrides = {}

	for (const verse of analysis.verses) {
		const key = String(verse.verseNumber)
		const raw = (inputs[key] ?? '').trim()
		if (!raw) continue
		const parts = raw
			.split('|')
			.map((part) => part.trim())
			.filter(Boolean)
		if (parts.length === 0) continue
		result[key] = parts
	}

	return result
}

export function LessonScriptIngestForm({
	locale,
	lessonId,
	lessonSlug,
	initialScript,
}: {
	locale: string
	lessonId: string
	lessonSlug: string
	initialScript: string
}) {
	const [lessonScript, setLessonScript] = useState(initialScript)
	const [loading, setLoading] = useState(false)
	const [analysis, setAnalysis] = useState<LessonScriptAnalysis | null>(null)
	const [overrideSelections, setOverrideSelections] = useState<Record<string, string>>({})
	const [segmentationInputs, setSegmentationInputs] = useState<Record<string, string>>({})
	const [analyzedSegmentationOverrides, setAnalyzedSegmentationOverrides] =
		useState<SegmentationOverrides>({})
	const [analyzedScript, setAnalyzedScript] = useState('')
	const [message, setMessage] = useState<string | null>(null)
	const [error, setError] = useState<string | null>(null)

	const needsReanalyze = useMemo(() => {
		if (!analysis) return false
		if (lessonScript !== analyzedScript) return true
		const currentOverrides = parseSegmentationOverrides(segmentationInputs, analysis)
		return JSON.stringify(currentOverrides) !== JSON.stringify(analyzedSegmentationOverrides)
	}, [
		analysis,
		lessonScript,
		analyzedScript,
		segmentationInputs,
		analyzedSegmentationOverrides,
	])

	const estimatedNewLexemes = useMemo(() => {
		if (!analysis) return 0
		let count = 0
		for (const verse of analysis.verses) {
			for (const token of verse.tokens) {
				if (!token.selectedCandidate && !overrideSelections[token.tokenKey]) {
					count += 1
				}
			}
		}
		return count
	}, [analysis, overrideSelections])

	function resetAnalysisOnly() {
		setAnalysis(null)
		setOverrideSelections({})
		setSegmentationInputs({})
		setAnalyzedSegmentationOverrides({})
	}

	async function runAnalyze(useManualSegmentation: boolean) {
		setLoading(true)
		setError(null)
		setMessage(null)

		try {
			const segmentationOverrides = useManualSegmentation
				? parseSegmentationOverrides(segmentationInputs, analysis)
				: {}

			const res = await fetch(`/api/admin/lessons/${lessonId}/script`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					lessonScript,
					segmentationOverrides,
				}),
			})
			const data = await res.json()
			if (!res.ok) {
				throw new Error(data?.error || 'Failed to analyze lesson script')
			}

			setAnalysis(data.analysis)
			setAnalyzedScript(lessonScript)
			setSegmentationInputs(analysisToSegmentationInputs(data.analysis))
			setAnalyzedSegmentationOverrides(segmentationOverrides)
			setOverrideSelections({})
			setMessage(
				`Analysis complete: ${data.analysis.verseCount} verses, ${data.analysis.tokenCount} tokens.`,
			)
		} catch (err) {
			setError(
				err instanceof Error ? err.message : 'Failed to analyze lesson script',
			)
		} finally {
			setLoading(false)
		}
	}

	async function onSaveScript() {
		if (!analysis || needsReanalyze) {
			setError('Analyze or Re-analyze with overrides before saving.')
			return
		}

		setLoading(true)
		setError(null)
		setMessage(null)

		try {
			const overrides: Record<string, { source: 'BIBLICAL' | 'CUSTOM'; id: string }> =
				{}

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

			const res = await fetch(`/api/admin/lessons/${lessonId}/script`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					lessonScript,
					analysisDigest: analysis.digest,
					overrides,
					segmentationOverrides: analyzedSegmentationOverrides,
				}),
			})

			const data = await res.json()
			if (!res.ok) {
				throw new Error(data?.error || 'Failed to save lesson script')
			}

			setMessage(
				`Saved: ${data.tokenCount} tokens, ${data.vocabCount} unique vocab, ${data.customLexemesAdded} custom lexemes added.`,
			)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to save lesson script')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
			<div>
				<h1 className="text-2xl font-semibold">Lesson Script Ingest</h1>
				<p className="text-sm text-muted-foreground">
					Lesson: {lessonSlug}. Each paragraph is treated as a verse.
				</p>
			</div>

			<Textarea
				dir="rtl"
				className="min-h-[220px] text-xl"
				placeholder="Paste lesson script text here. Separate verses with a blank line."
				value={lessonScript}
				onChange={(e) => {
					setLessonScript(e.target.value)
					setError(null)
					resetAnalysisOnly()
				}}
			/>

			<div className="flex flex-wrap items-center gap-2">
				<Button disabled={loading || !lessonScript.trim()} onClick={() => runAnalyze(false)}>
					{loading ? 'Analyzing...' : 'Analyze'}
				</Button>
				<Button
					disabled={loading || !analysis || !lessonScript.trim()}
					onClick={() => runAnalyze(true)}
				>
					{loading ? 'Re-analyzing...' : 'Reanalyze With Overrides'}
				</Button>
				<Button
					disabled={loading || !analysis || !lessonScript.trim() || needsReanalyze}
					onClick={onSaveScript}
				>
					Save Script + Generate Vocab
				</Button>
				<Link href={`/${locale}/admin/courses/lessons/${lessonId}/vocab`}>
					<Button variant="outline">Review Lesson Vocab</Button>
				</Link>
			</div>

			{analysis ? (
				<div className="rounded-md border p-3 text-sm text-muted-foreground">
					<p>
						Verses: {analysis.verseCount} | Tokens: {analysis.tokenCount} | Known:{' '}
						{analysis.knownTokenCount} | New: {analysis.newTokenCount} | Unique vocab:{' '}
						{analysis.vocabCount} | New custom lexemes to add: {estimatedNewLexemes}
					</p>
					{needsReanalyze ? (
						<p className="text-red-600">
							Script or manual segmentation changed. Please re-analyze.
						</p>
					) : null}
				</div>
			) : null}

			{analysis ? (
				<div className="rounded border p-3 text-sm">
					<h2 className="mb-2 font-semibold">Per-Word Analysis</h2>
					<div className="space-y-4" dir="rtl">
						{analysis.verses.map((verse) => (
							<div key={verse.verseNumber} className="rounded border p-2">
								<p className="mb-2 text-xs text-muted-foreground">
									Verse {verse.verseNumber}
								</p>
								<div className="mb-3 flex flex-col gap-1">
									<label className="text-xs font-medium">
										Manual Segmentation ({'|'} separated tokens)
									</label>
									<Textarea
										value={segmentationInputs[String(verse.verseNumber)] ?? ''}
										className="min-h-[90px] text-2xl leading-relaxed"
										onChange={(e) =>
											setSegmentationInputs((prev) => ({
												...prev,
												[String(verse.verseNumber)]: e.target.value,
											}))
										}
									/>
								</div>
								<div className="flex flex-wrap items-start gap-2">
									{verse.tokens.map((token) => {
										const defaultValue = token.selectedCandidate
											? encodeCandidate(token.selectedCandidate)
											: ''
										const selectedValue =
											overrideSelections[token.tokenKey] ?? defaultValue

										return (
											<div
												key={token.tokenKey}
												className={
													token.known
														? 'min-w-[170px] rounded border border-emerald-200 bg-emerald-50 px-2 py-2'
														: 'min-w-[170px] rounded border border-amber-300 bg-amber-50 px-2 py-2'
												}
											>
												<p className="text-lg leading-tight">{token.surface}</p>
												<p className="text-[11px] text-muted-foreground">
													{token.consonants}
												</p>
												{token.candidates.length > 0 ? (
													<select
														className="mt-2 w-full rounded border bg-white px-1 py-1 text-xs"
														value={selectedValue}
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
													<p className="mt-2 text-[11px] text-amber-700">
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
			) : null}

			{message ? <p className="text-sm text-green-700">{message}</p> : null}
			{error ? <p className="text-sm text-red-600">{error}</p> : null}
		</div>
	)
}

