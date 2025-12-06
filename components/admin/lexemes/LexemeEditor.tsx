// components/admin/lexemes/LexemeEditor.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
	Select,
	SelectTrigger,
	SelectContent,
	SelectItem,
	SelectValue,
} from '@/components/ui/select'
import { hebrewLexemes } from '@/db'

type Lexeme = typeof hebrewLexemes.$inferSelect

export default function LexemeEditor({ initial }: { initial: Lexeme }) {
	const [form, setForm] = useState<Lexeme>(initial)
	const [saving, setSaving] = useState(false)
	const [status, setStatus] = useState<string | null>(null)

	function update<K extends keyof Lexeme>(key: K, value: Lexeme[K]) {
		setForm((prev) => ({ ...prev, [key]: value }))
	}

	async function save() {
		setSaving(true)
		setStatus(null)

		const res = await fetch(`/api/lexemes/${form.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(form),
		})

		setSaving(false)

		if (!res.ok) {
			setStatus('Error saving lexeme.')
			return
		}

		setStatus('Saved!')
	}

	return (
		<div className="space-y-8">
			{/* Lemma Section */}
			<div>
				<h2 className="text-xl font-semibold mb-2">Lemma</h2>
				<div className="grid grid-cols-2 gap-4">
					<div>
						<label className="text-sm font-medium">Lemma (ETCBC code)</label>
						<Input
							value={form.lemma || ''}
							onChange={(e) => update('lemma', e.target.value)}
						/>
					</div>

					<div>
						<label className="text-sm font-medium">Lemma Vocalized</label>
						<Input
							value={form.lemmaVocalized || ''}
							onChange={(e) => update('lemmaVocalized', e.target.value)}
						/>
					</div>
				</div>
			</div>

			<Separator />

			{/* POS + Binyan */}
			<div>
				<h2 className="text-xl font-semibold mb-4">Grammar</h2>
				<div className="grid grid-cols-2 gap-4">
					{/* Part of Speech */}
					<div>
						<label className="text-sm font-medium">Part of Speech</label>
						<Select
							value={form.partOfSpeech ?? ''}
							onValueChange={(v) => update('partOfSpeech', v)}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select POS" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="verb">Verb</SelectItem>
								<SelectItem value="subs">Noun</SelectItem>
								<SelectItem value="adjv">Adjective</SelectItem>
								<SelectItem value="advb">Adverb</SelectItem>
								<SelectItem value="prep">Preposition</SelectItem>
								<SelectItem value="conj">Conjunction</SelectItem>
								<SelectItem value="pron">Pronoun</SelectItem>
								<SelectItem value="intj">Interjection</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Binyan */}
					<div>
						<label className="text-sm font-medium">Binyan</label>
						<Select
							value={form.binyan ?? ''}
							onValueChange={(v) => update('binyan', v)}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select Binyan" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="qal">Qal</SelectItem>
								<SelectItem value="nif">Nifal</SelectItem>
								<SelectItem value="pi">Piel</SelectItem>
								<SelectItem value="pu">Pual</SelectItem>
								<SelectItem value="hit">Hitpael</SelectItem>
								<SelectItem value="hif">Hifil</SelectItem>
								<SelectItem value="hof">Hofal</SelectItem>
								<SelectItem value="NA">Not applicable</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			</div>

			<Separator />

			{/* Glosses */}
			<div>
				<h2 className="text-xl font-semibold mb-2">Glosses</h2>
				<div className="grid grid-cols-2 gap-4">
					<div>
						<label className="text-sm font-medium">English</label>
						<Input
							value={form.glossEnglish || ''}
							onChange={(e) => update('glossEnglish', e.target.value)}
						/>
					</div>
					<div>
						<label className="text-sm font-medium">Español</label>
						<Input
							value={form.glossEspanol || ''}
							onChange={(e) => update('glossEspanol', e.target.value)}
						/>
					</div>
					<div>
						<label className="text-sm font-medium">Português</label>
						<Input
							value={form.glossPortugues || ''}
							onChange={(e) => update('glossPortugues', e.target.value)}
						/>
					</div>
					<div>
						<label className="text-sm font-medium">Dutch / Nederlands</label>
						<Input
							value={form.glossNetherlands || ''}
							onChange={(e) => update('glossNetherlands', e.target.value)}
						/>
					</div>
					<div>
						<label className="text-sm font-medium">Greek (ΜΝΕ)</label>
						<Input
							value={form.glossGreek || ''}
							onChange={(e) => update('glossGreek', e.target.value)}
						/>
					</div>
				</div>
			</div>

			<Separator />

			{/* Definition */}
			<div>
				<h2 className="text-xl font-semibold mb-2">Definition</h2>
				<Textarea
					value={form.definition || ''}
					onChange={(e) => update('definition', e.target.value)}
					rows={4}
				/>
			</div>

			<Separator />

			{/* Notes */}
			<div>
				<h2 className="text-xl font-semibold mb-2">Notes</h2>
				<Textarea
					value={form.notes || ''}
					onChange={(e) => update('notes', e.target.value)}
					rows={4}
				/>
			</div>

			{/* Save Button */}
			<div className="flex items-center gap-4">
				<Button onClick={save} disabled={saving}>
					{saving ? 'Saving…' : 'Save'}
				</Button>

				{status && <span className="text-green-600">{status}</span>}
			</div>
		</div>
	)
}
