'use client'

import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import StudyGroupLessonSelector from './study-group-lesson-selector'

type SessionFormModalProps = {
	open: boolean
	setOpen: (value: boolean) => void
	studyGroup: any
	formData: {
		class_date: string
		notes: string
		homework_instructions: string
		homework_links: { label: string; url: string }[]
		lessons: { id: number; title: string }[]
		recording_link: string
	}
	setFormData: React.Dispatch<
		React.SetStateAction<{
			class_date: string
			notes: string
			homework_instructions: string
			homework_links: { label: string; url: string }[]
			lessons: { id: number; title: string }[]
			recording_link: string
		}>
	>
	editingSession: any | null
	setEditingSession: (session: any | null) => void
	handleSaveSession: () => Promise<void>
	toLocalInputValue: (isoString: string) => string
}

export default function SessionFormModal({
	open,
	setOpen,
	studyGroup,
	formData,
	setFormData,
	editingSession,
	setEditingSession,
	handleSaveSession,
	toLocalInputValue,
}: SessionFormModalProps) {
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="sm" onClick={() => setEditingSession(null)}>
					Add Session
				</Button>
			</DialogTrigger>

			<DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{editingSession ? 'Edit Class Session' : 'Add Class Session'}
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-3">
					<label className="block text-sm font-medium">Date & Time</label>
					<Input
						type="datetime-local"
						value={toLocalInputValue(formData.class_date)}
						onChange={(e) => {
							const localString = e.target.value
							if (!localString) {
								setFormData({ ...formData, class_date: '' })
								return
							}
							const [datePart, timePart] = localString.split('T')
							const [year, month, day] = datePart.split('-').map(Number)
							const [hour, minute] = timePart.split(':').map(Number)
							const localDate = new Date(year, month - 1, day, hour, minute)
							setFormData({
								...formData,
								class_date: localDate.toISOString(),
							})
						}}
					/>

					<label className="block text-sm font-medium mt-3">
						Class Recording (YouTube URL)
					</label>
					<Input
						placeholder="https://youtube.com/watch?v=..."
						value={formData.recording_link || ''}
						onChange={(e) =>
							setFormData({
								...formData,
								recording_link: e.target.value,
							})
						}
					/>

					<label className="block text-sm font-medium mt-3">Notes</label>
					<Textarea
						rows={2}
						value={formData.notes}
						onChange={(e) =>
							setFormData({ ...formData, notes: e.target.value })
						}
					/>

					<label className="block text-sm font-medium mt-3">
						Homework Instructions
					</label>
					<Textarea
						rows={2}
						value={formData.homework_instructions}
						onChange={(e) =>
							setFormData({
								...formData,
								homework_instructions: e.target.value,
							})
						}
					/>

					<label className="block text-sm font-medium mt-3">
						Homework Links
					</label>
					<div className="space-y-2">
						{formData.homework_links.map((link, index) => (
							<div key={index} className="flex gap-2">
								<Input
									placeholder="Label (e.g. Watch video)"
									value={link.label}
									onChange={(e) => {
										const updated = [...formData.homework_links]
										updated[index].label = e.target.value
										setFormData({ ...formData, homework_links: updated })
									}}
								/>
								<Input
									placeholder="URL"
									value={link.url}
									onChange={(e) => {
										const updated = [...formData.homework_links]
										updated[index].url = e.target.value
										setFormData({ ...formData, homework_links: updated })
									}}
								/>
								<Button
									variant="ghost"
									onClick={() => {
										setFormData({
											...formData,
											homework_links: formData.homework_links.filter(
												(_, i) => i !== index
											),
										})
									}}
								>
									❌
								</Button>
							</div>
						))}
						<Button
							size="sm"
							onClick={() =>
								setFormData({
									...formData,
									homework_links: [
										...formData.homework_links,
										{ label: '', url: '' },
									],
								})
							}
						>
							➕ Add Link
						</Button>
					</div>

					<label className="block text-sm font-medium mt-3">
						Assigned Lesson
					</label>
					<StudyGroupLessonSelector
						studyGroup={studyGroup}
						selectedLessonIds={formData.lessons.map((l) => l.id)}
						onLessonSelect={(lesson, checked) =>
							setFormData((prev) => {
								if (checked) {
									return { ...prev, lessons: [...prev.lessons, lesson] }
								} else {
									return {
										...prev,
										lessons: prev.lessons.filter((l) => l.id !== lesson.id),
									}
								}
							})
						}
					/>
				</div>

				<DialogFooter className="mt-4 flex justify-end gap-2">
					<Button variant="secondary" onClick={() => setOpen(false)}>
						Cancel
					</Button>
					<Button onClick={handleSaveSession}>Save</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
