'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Plus, Trash } from 'lucide-react'

interface LessonForm {
	title: string
	locale: string
}

interface UnitForm {
	title: string
	locale: string
	lessons: LessonForm[]
}

interface CourseForm {
	slug: string
	imageSrc: string
	category: string
	translations: {
		locale: string
		title: string
		description: string
	}[]
	units: UnitForm[]
}

export default function CreateCourse() {
	const [form, setForm] = useState<CourseForm>({
		slug: '',
		imageSrc: '',
		category: '',
		translations: [{ locale: 'en', title: '', description: '' }],
		units: [],
	})

	const [loading, setLoading] = useState(false)

	function addTranslation() {
		setForm({
			...form,
			translations: [
				...form.translations,
				{ locale: '', title: '', description: '' },
			],
		})
	}

	function removeTranslation(index: number) {
		setForm({
			...form,
			translations: form.translations.filter((_, i) => i !== index),
		})
	}

	function addUnit() {
		setForm({
			...form,
			units: [...form.units, { title: '', locale: 'en', lessons: [] }],
		})
	}

	function removeUnit(i: number) {
		setForm({
			...form,
			units: form.units.filter((_, idx) => idx !== i),
		})
	}

	function addLesson(unitIndex: number) {
		const updatedUnits = [...form.units]
		updatedUnits[unitIndex].lessons.push({ title: '', locale: 'en' })
		setForm({ ...form, units: updatedUnits })
	}

	function removeLesson(unitIndex: number, lessonIndex: number) {
		const updatedUnits = [...form.units]
		updatedUnits[unitIndex].lessons.splice(lessonIndex, 1)
		setForm({ ...form, units: updatedUnits })
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setLoading(true)

		const res = await fetch('/api/admin/courses', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(form),
		})

		setLoading(false)
		alert(res.ok ? '✅ Course created!' : '❌ Failed to create course.')
	}

	return (
		<div className="max-w-3xl mx-auto space-y-6 p-6">
			<h1 className="text-3xl font-bold">Create Course</h1>
			<form onSubmit={handleSubmit} className="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle>Course Info</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<Input
							placeholder="Slug (e.g. biblical-hebrew)"
							value={form.slug}
							onChange={(e) => setForm({ ...form, slug: e.target.value })}
						/>
						<Input
							placeholder="Category"
							value={form.category}
							onChange={(e) => setForm({ ...form, category: e.target.value })}
						/>
						<Input
							placeholder="Image URL"
							value={form.imageSrc}
							onChange={(e) => setForm({ ...form, imageSrc: e.target.value })}
						/>
						<Separator />
						<div className="space-y-2">
							<h3 className="font-semibold">Translations</h3>
							{form.translations.map((t, i) => (
								<Card key={i} className="p-4">
									<div className="flex gap-3 items-center">
										<Input
											placeholder="Locale (en, es, he)"
											value={t.locale}
											onChange={(e) => {
												const updated = [...form.translations]
												updated[i].locale = e.target.value
												setForm({ ...form, translations: updated })
											}}
											className="w-24"
										/>
										<Button
											type="button"
											variant="destructive"
											size="icon"
											onClick={() => removeTranslation(i)}
										>
											<Trash className="w-4 h-4" />
										</Button>
									</div>
									<Input
										placeholder="Title"
										value={t.title}
										onChange={(e) => {
											const updated = [...form.translations]
											updated[i].title = e.target.value
											setForm({ ...form, translations: updated })
										}}
										className="mt-2"
									/>
									<Textarea
										placeholder="Description"
										value={t.description}
										onChange={(e) => {
											const updated = [...form.translations]
											updated[i].description = e.target.value
											setForm({ ...form, translations: updated })
										}}
										className="mt-2"
									/>
								</Card>
							))}
							<Button type="button" onClick={addTranslation} variant="outline">
								<Plus className="w-4 h-4 mr-2" /> Add Translation
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* Units Section */}
				<Card>
					<CardHeader>
						<CardTitle>Units & Lessons</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{form.units.map((unit, ui) => (
							<div key={ui} className="border p-4 rounded-md">
								<div className="flex justify-between items-center mb-3">
									<h3 className="font-medium">Unit {ui + 1}</h3>
									<Button
										type="button"
										variant="destructive"
										size="icon"
										onClick={() => removeUnit(ui)}
									>
										<Trash className="w-4 h-4" />
									</Button>
								</div>
								<Input
									placeholder="Locale (en, es, he)"
									value={unit.locale}
									onChange={(e) => {
										const updated = [...form.units]
										updated[ui].locale = e.target.value
										setForm({ ...form, units: updated })
									}}
								/>
								<Input
									placeholder="Unit Title"
									value={unit.title}
									onChange={(e) => {
										const updated = [...form.units]
										updated[ui].title = e.target.value
										setForm({ ...form, units: updated })
									}}
									className="mt-2"
								/>

								{/* Lessons */}
								<div className="mt-3 space-y-2">
									<h4 className="font-semibold">Lessons</h4>
									{unit.lessons.map((lesson, li) => (
										<div key={li} className="flex items-center gap-2">
											<Input
												placeholder="Lesson Title"
												value={lesson.title}
												onChange={(e) => {
													const updated = [...form.units]
													updated[ui].lessons[li].title = e.target.value
													setForm({ ...form, units: updated })
												}}
											/>
											<Input
												placeholder="Locale"
												value={lesson.locale}
												onChange={(e) => {
													const updated = [...form.units]
													updated[ui].lessons[li].locale = e.target.value
													setForm({ ...form, units: updated })
												}}
												className="w-20"
											/>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												onClick={() => removeLesson(ui, li)}
											>
												<Trash className="w-4 h-4" />
											</Button>
										</div>
									))}
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => addLesson(ui)}
									>
										<Plus className="w-4 h-4 mr-2" /> Add Lesson
									</Button>
								</div>
							</div>
						))}

						<Button type="button" onClick={addUnit}>
							<Plus className="w-4 h-4 mr-2" /> Add Unit
						</Button>
					</CardContent>
				</Card>

				<Button type="submit" className="w-full" disabled={loading}>
					{loading ? 'Saving...' : 'Create Course'}
				</Button>
			</form>
		</div>
	)
}
