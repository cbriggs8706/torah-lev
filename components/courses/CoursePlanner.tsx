'use client'

import * as React from 'react'
import { addDays } from 'date-fns'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { RichTextEditor } from '@/components/courses/RichTextEditor'

const DAY_OPTIONS = [
	{ value: 0, label: 'Sun', key: 'SUN' },
	{ value: 1, label: 'Mon', key: 'MON' },
	{ value: 2, label: 'Tue', key: 'TUE' },
	{ value: 3, label: 'Wed', key: 'WED' },
	{ value: 4, label: 'Thu', key: 'THU' },
	{ value: 5, label: 'Fri', key: 'FRI' },
	{ value: 6, label: 'Sat', key: 'SAT' },
] as const

type PlannerAssignment = {
	sourceType: 'existing_lesson' | 'existing_chapter' | 'custom'
	unitId?: string | null
	lessonId?: string | null
	chapterRef?: string | null
	title: string
	contentHtml?: string | null
	contentText?: string | null
	attachments: Array<{
		path: string
		url: string
		name: string
		size: number
		mimeType: string
	}>
	orderIndex: number
}

type PlannerOccurrence = {
	id?: string
	startsAt: string
	endsAt?: string | null
	timezone: string
	title?: string | null
	notes?: string | null
	isCanceled: boolean
	attendanceEnabled: boolean
	assignments: PlannerAssignment[]
}

type UnitDraft = {
	id?: string
	slug: string
	description?: string | null
	lessons: Array<{
		id?: string
		slug: string
		lessonNumber: string
		description: string
	}>
}

function toLocalInputValue(iso?: string | null) {
	if (!iso) return ''
	const date = new Date(iso)
	const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
	return local.toISOString().slice(0, 16)
}

function toIsoFromLocalInput(value: string) {
	if (!value) return ''
	return new Date(value).toISOString()
}

function createDefaultAssignment(orderIndex: number): PlannerAssignment {
	return {
		sourceType: 'custom',
		title: '',
		contentHtml: '',
		contentText: '',
		attachments: [],
		orderIndex,
	}
}

	function createDefaultOccurrence(): PlannerOccurrence {
	const now = new Date()
	const start = new Date(now.getTime() + 60 * 60 * 1000)
	const end = new Date(start.getTime() + 60 * 60 * 1000)
	return {
		startsAt: start.toISOString(),
		endsAt: end.toISOString(),
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Denver',
		title: '',
		notes: '',
		isCanceled: false,
		attendanceEnabled: false,
		assignments: [],
	}
}

function generateOccurrences(params: {
	startDate: string
	endDate: string
	startTime: string
	endTime: string
	weekdays: number[]
	timezone: string
}) {
	const start = new Date(`${params.startDate}T00:00:00`)
	const end = new Date(`${params.endDate}T00:00:00`)
	if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
		return []
	}

	const [startHour, startMinute] = params.startTime.split(':').map(Number)
	const [endHour, endMinute] = params.endTime.split(':').map(Number)
	const output: PlannerOccurrence[] = []

	for (let cursor = new Date(start); cursor <= end; cursor = addDays(cursor, 1)) {
		if (!params.weekdays.includes(cursor.getDay())) continue

		const startsAt = new Date(cursor)
		startsAt.setHours(startHour || 0, startMinute || 0, 0, 0)

		const endsAt = new Date(cursor)
		endsAt.setHours(endHour || startHour || 0, endMinute || startMinute || 0, 0, 0)

		output.push({
			startsAt: startsAt.toISOString(),
			endsAt: endsAt.toISOString(),
			timezone: params.timezone,
			title: '',
			notes: '',
			isCanceled: false,
			attendanceEnabled: false,
			assignments: [],
		})
	}

	return output
}

export function CoursePlanner({
	courseId,
	units,
	disabled,
}: {
	courseId: string
	units: UnitDraft[]
	disabled?: boolean
}) {
	const [loading, setLoading] = React.useState(true)
	const [saving, setSaving] = React.useState(false)
	const [occurrences, setOccurrences] = React.useState<PlannerOccurrence[]>([])
	const [uploadingKey, setUploadingKey] = React.useState<string | null>(null)
	const [roster, setRoster] = React.useState<
		Array<{
			userId: string
			name: string | null
			email: string | null
			image: string | null
			role: 'organizer' | 'teacher' | 'ta' | 'student'
		}>
	>([])
	const [selectedAttendanceOccurrenceId, setSelectedAttendanceOccurrenceId] =
		React.useState<string>('')
	const [attendanceRoster, setAttendanceRoster] = React.useState<
		Array<{
			userId: string
			name: string | null
			email: string | null
			status: 'present' | 'absent' | 'late' | null
			notes: string | null
		}>
	>([])
	const [savingAttendance, setSavingAttendance] = React.useState(false)
	const [recurrence, setRecurrence] = React.useState({
		startDate: '',
		endDate: '',
		startTime: '19:00',
		endTime: '20:00',
		weekdays: [1],
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Denver',
	})

	const lessonOptions = React.useMemo(
		() =>
			units.flatMap((unit) =>
				unit.lessons
					.filter((lesson) => lesson.id)
					.map((lesson) => ({
						lessonId: lesson.id as string,
						unitId: unit.id ?? null,
						label: `${unit.description || unit.slug} • ${lesson.lessonNumber} ${lesson.description}`,
					}))
			),
		[units]
	)

	React.useEffect(() => {
		let active = true
		async function load() {
			try {
				const [plannerRes, membershipsRes] = await Promise.all([
					fetch(`/api/courses/${courseId}/planner`, {
						cache: 'no-store',
					}),
					fetch(`/api/courses/${courseId}/memberships`, {
						cache: 'no-store',
					}),
				])
				if (!plannerRes.ok) throw new Error('Failed to load planner')
				if (!membershipsRes.ok) throw new Error('Failed to load memberships')
				const plannerData = await plannerRes.json()
				const membershipData = await membershipsRes.json()
				if (!active) return
				setOccurrences(plannerData.occurrences ?? [])
				setRoster(membershipData.roster ?? [])
			} catch (error) {
				console.error(error)
				toast.error('Failed to load planner data')
			} finally {
				if (active) setLoading(false)
			}
		}

		void load()
		return () => {
			active = false
		}
	}, [courseId])

	async function loadAttendance(occurrenceId: string) {
		try {
			const res = await fetch(
				`/api/courses/${courseId}/attendance?occurrenceId=${occurrenceId}`,
				{
					cache: 'no-store',
				}
			)
			if (!res.ok) throw new Error('Failed to load attendance')
			const data = await res.json()
			setAttendanceRoster(data.roster ?? [])
			} catch (error) {
				console.error(error)
				toast.error('Could not load attendance')
			}
		}

	function toggleWeekday(day: number) {
		setRecurrence((prev) => {
			const exists = prev.weekdays.includes(day)
			return {
				...prev,
				weekdays: exists
					? prev.weekdays.filter((d) => d !== day)
					: [...prev.weekdays, day].sort(),
			}
		})
	}

	function addGeneratedOccurrences() {
		const generated = generateOccurrences(recurrence)
		if (generated.length === 0) {
			toast.error('No matching dates for recurrence settings')
			return
		}
		setOccurrences((prev) => {
			const keys = new Set(prev.map((o) => `${o.startsAt}-${o.endsAt || ''}`))
			const unique = generated.filter((g) => !keys.has(`${g.startsAt}-${g.endsAt || ''}`))
			return [...prev, ...unique].sort(
				(a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
			)
		})
	}

	function updateOccurrence(index: number, patch: Partial<PlannerOccurrence>) {
		setOccurrences((prev) =>
			prev.map((occ, i) => (i === index ? { ...occ, ...patch } : occ))
		)
	}

	function removeOccurrence(index: number) {
		setOccurrences((prev) => prev.filter((_, i) => i !== index))
	}

	function addAssignment(occurrenceIndex: number) {
		setOccurrences((prev) =>
			prev.map((occ, i) =>
				i === occurrenceIndex
					? {
							...occ,
							assignments: [...occ.assignments, createDefaultAssignment(occ.assignments.length)],
					  }
					: occ
			)
		)
	}

	function updateAssignment(
		occurrenceIndex: number,
		assignmentIndex: number,
		patch: Partial<PlannerAssignment>
	) {
		setOccurrences((prev) =>
			prev.map((occ, i) => {
				if (i !== occurrenceIndex) return occ
				return {
					...occ,
					assignments: occ.assignments.map((assignment, ai) =>
						ai === assignmentIndex ? { ...assignment, ...patch } : assignment
					),
				}
			})
		)
	}

	function removeAssignment(occurrenceIndex: number, assignmentIndex: number) {
		setOccurrences((prev) =>
			prev.map((occ, i) => {
				if (i !== occurrenceIndex) return occ
				const next = occ.assignments.filter((_, ai) => ai !== assignmentIndex)
				return {
					...occ,
					assignments: next.map((item, idx) => ({ ...item, orderIndex: idx })),
				}
			})
		)
	}

	async function uploadAttachment(
		occurrenceIndex: number,
		assignmentIndex: number,
		file: File
	) {
		const key = `${occurrenceIndex}-${assignmentIndex}`
		setUploadingKey(key)
		try {
			const formData = new FormData()
			formData.append('file', file)
			const res = await fetch(`/api/courses/${courseId}/attachments`, {
				method: 'POST',
				body: formData,
			})
			if (!res.ok) throw new Error('Upload failed')
			const attachment = await res.json()
			setOccurrences((prev) =>
				prev.map((occ, oi) => {
					if (oi !== occurrenceIndex) return occ
					return {
						...occ,
						assignments: occ.assignments.map((assignment, ai) =>
							ai === assignmentIndex
								? {
										...assignment,
										attachments: [...assignment.attachments, attachment],
								  }
								: assignment
						),
					}
				})
			)
		} catch (error) {
			console.error(error)
			toast.error('Failed to upload attachment')
		} finally {
			setUploadingKey(null)
		}
	}

	async function savePlanner() {
		setSaving(true)
		try {
			const payload = {
				occurrences: occurrences.map((occurrence) => ({
					...occurrence,
					assignments: occurrence.assignments.map((assignment, index) => ({
						...assignment,
						orderIndex: index,
					})),
				})),
			}
			const res = await fetch(`/api/courses/${courseId}/planner`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			})
			if (!res.ok) throw new Error('Failed to save planner')
			const data = await res.json()
			setOccurrences(data.occurrences ?? [])
			toast.success('Planner saved')
		} catch (error) {
			console.error(error)
			toast.error('Could not save planner')
		} finally {
			setSaving(false)
		}
	}

	async function updateRole(
		userId: string,
		role: 'organizer' | 'teacher' | 'ta' | 'student'
	) {
		try {
			const res = await fetch(`/api/courses/${courseId}/memberships`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId, role }),
			})
			if (!res.ok) throw new Error('Failed to update role')
			const data = await res.json()
			setRoster(data.roster ?? [])
		} catch (error) {
			console.error(error)
			toast.error('Could not update role')
		}
	}

	async function saveAttendance() {
		if (!selectedAttendanceOccurrenceId) return
		setSavingAttendance(true)
		try {
			const records = attendanceRoster
				.filter((entry) => entry.status)
				.map((entry) => ({
					userId: entry.userId,
					status: entry.status!,
					notes: entry.notes ?? undefined,
				}))
			const res = await fetch(`/api/courses/${courseId}/attendance`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					occurrenceId: selectedAttendanceOccurrenceId,
					records,
				}),
			})
			if (!res.ok) throw new Error('Failed to save attendance')
			toast.success('Attendance saved')
		} catch (error) {
			console.error(error)
			toast.error('Could not save attendance')
		} finally {
			setSavingAttendance(false)
		}
	}

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Schedule Planner</CardTitle>
				</CardHeader>
				<CardContent>Loading planner...</CardContent>
			</Card>
		)
	}

	return (
		<Card className="mt-8">
			<CardHeader>
				<CardTitle>Schedule + Assignments Planner</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="rounded-md border p-4 space-y-3">
					<h3 className="font-medium">Generate Recurring Occurrences</h3>
					<div className="grid gap-3 md:grid-cols-2">
						<Input
							type="date"
							value={recurrence.startDate}
							onChange={(e) =>
								setRecurrence((prev) => ({ ...prev, startDate: e.target.value }))
							}
							disabled={disabled}
						/>
						<Input
							type="date"
							value={recurrence.endDate}
							onChange={(e) =>
								setRecurrence((prev) => ({ ...prev, endDate: e.target.value }))
							}
							disabled={disabled}
						/>
						<Input
							type="time"
							value={recurrence.startTime}
							onChange={(e) =>
								setRecurrence((prev) => ({ ...prev, startTime: e.target.value }))
							}
							disabled={disabled}
						/>
						<Input
							type="time"
							value={recurrence.endTime}
							onChange={(e) =>
								setRecurrence((prev) => ({ ...prev, endTime: e.target.value }))
							}
							disabled={disabled}
						/>
						<Input
							placeholder="Timezone"
							value={recurrence.timezone}
							onChange={(e) =>
								setRecurrence((prev) => ({ ...prev, timezone: e.target.value }))
							}
							disabled={disabled}
						/>
					</div>
					<div className="flex flex-wrap gap-2">
						{DAY_OPTIONS.map((day) => {
							const selected = recurrence.weekdays.includes(day.value)
							return (
								<Button
									key={day.key}
									type="button"
									variant={selected ? 'default' : 'outline'}
									size="sm"
									onClick={() => toggleWeekday(day.value)}
									disabled={disabled}
								>
									{day.label}
								</Button>
							)
						})}
					</div>
					<div className="flex gap-2">
						<Button type="button" onClick={addGeneratedOccurrences} disabled={disabled}>
							Generate
						</Button>
						<Button
							type="button"
							variant="outline"
							onClick={() => setOccurrences((prev) => [...prev, createDefaultOccurrence()])}
							disabled={disabled}
						>
							Add One
						</Button>
					</div>
				</div>

				<div className="space-y-4">
					{occurrences.map((occurrence, occurrenceIndex) => (
						<div key={`${occurrence.startsAt}-${occurrenceIndex}`} className="border rounded-md p-4 space-y-4">
							<div className="grid gap-3 md:grid-cols-2">
								<Input
									type="datetime-local"
									value={toLocalInputValue(occurrence.startsAt)}
									onChange={(e) =>
										updateOccurrence(occurrenceIndex, {
											startsAt: toIsoFromLocalInput(e.target.value),
										})
									}
									disabled={disabled}
								/>
								<Input
									type="datetime-local"
									value={toLocalInputValue(occurrence.endsAt)}
									onChange={(e) =>
										updateOccurrence(occurrenceIndex, {
											endsAt: toIsoFromLocalInput(e.target.value),
										})
									}
									disabled={disabled}
								/>
								<Input
									placeholder="Session title (optional)"
									value={occurrence.title ?? ''}
									onChange={(e) =>
										updateOccurrence(occurrenceIndex, { title: e.target.value })
									}
									disabled={disabled}
								/>
								<Input
									placeholder="Timezone"
									value={occurrence.timezone}
									onChange={(e) =>
										updateOccurrence(occurrenceIndex, { timezone: e.target.value })
									}
									disabled={disabled}
								/>
							</div>
							<Textarea
								rows={2}
								placeholder="Session notes"
								value={occurrence.notes ?? ''}
								onChange={(e) =>
									updateOccurrence(occurrenceIndex, { notes: e.target.value })
								}
								disabled={disabled}
							/>
							<div className="flex flex-wrap gap-6">
								<label className="flex items-center gap-2 text-sm">
									<Switch
										checked={occurrence.isCanceled}
										onCheckedChange={(value) =>
											updateOccurrence(occurrenceIndex, { isCanceled: value })
										}
										disabled={disabled}
									/>
									Canceled
								</label>
								<label className="flex items-center gap-2 text-sm">
									<Switch
										checked={occurrence.attendanceEnabled}
										onCheckedChange={(value) =>
											updateOccurrence(occurrenceIndex, { attendanceEnabled: value })
										}
										disabled={disabled}
									/>
									Attendance enabled
								</label>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => removeOccurrence(occurrenceIndex)}
									disabled={disabled}
								>
									Remove Session
								</Button>
							</div>

							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<h4 className="font-medium">Assignments</h4>
									<Button
										type="button"
										size="sm"
										variant="outline"
										onClick={() => addAssignment(occurrenceIndex)}
										disabled={disabled}
									>
										Add Assignment
									</Button>
								</div>
								{occurrence.assignments.map((assignment, assignmentIndex) => {
									const uploadKey = `${occurrenceIndex}-${assignmentIndex}`
									return (
										<div key={`${uploadKey}-${assignment.orderIndex}`} className="border rounded-md p-3 space-y-3">
											<div className="grid gap-3 md:grid-cols-2">
												<select
													className="border rounded-md h-10 px-3 bg-background"
													value={assignment.sourceType}
													onChange={(e) =>
														updateAssignment(occurrenceIndex, assignmentIndex, {
															sourceType: e.target.value as PlannerAssignment['sourceType'],
															lessonId: null,
															unitId: null,
															chapterRef: '',
														})
													}
													disabled={disabled}
												>
													<option value="custom">Custom</option>
													<option value="existing_lesson">Existing Lesson</option>
													<option value="existing_chapter">Existing Chapter</option>
												</select>
												<Input
													placeholder="Assignment title"
													value={assignment.title}
													onChange={(e) =>
														updateAssignment(occurrenceIndex, assignmentIndex, {
															title: e.target.value,
														})
													}
													disabled={disabled}
												/>
											</div>

											{assignment.sourceType === 'existing_lesson' && (
												<select
													className="border rounded-md h-10 px-3 w-full bg-background"
													value={assignment.lessonId ?? ''}
													onChange={(e) => {
														const selected = lessonOptions.find(
															lesson => lesson.lessonId === e.target.value
														)
														updateAssignment(occurrenceIndex, assignmentIndex, {
															lessonId: selected?.lessonId ?? null,
															unitId: selected?.unitId ?? null,
														})
													}}
													disabled={disabled}
												>
													<option value="">Select lesson</option>
													{lessonOptions.map((lesson) => (
														<option key={lesson.lessonId} value={lesson.lessonId}>
															{lesson.label}
														</option>
													))}
												</select>
											)}

											{assignment.sourceType === 'existing_chapter' && (
												<Input
													placeholder="Chapter reference (e.g., Genesis 1)"
													value={assignment.chapterRef ?? ''}
													onChange={(e) =>
														updateAssignment(occurrenceIndex, assignmentIndex, {
															chapterRef: e.target.value,
														})
													}
													disabled={disabled}
												/>
											)}

											<RichTextEditor
												value={assignment.contentHtml ?? ''}
												onChange={(value) =>
													updateAssignment(occurrenceIndex, assignmentIndex, {
														contentHtml: value,
													})
												}
												disabled={disabled}
												height={280}
											/>

											<div className="space-y-2">
												<div className="flex items-center gap-2">
													<Input
														type="file"
														disabled={disabled || uploadingKey === uploadKey}
														onChange={(e) => {
															const file = e.target.files?.[0]
															if (!file) return
															void uploadAttachment(
																occurrenceIndex,
																assignmentIndex,
																file
															)
															e.currentTarget.value = ''
														}}
													/>
												</div>
												{assignment.attachments.length > 0 && (
													<div className="space-y-1 text-sm">
														{assignment.attachments.map((attachment, ai) => (
															<div key={`${attachment.path}-${ai}`} className="flex items-center justify-between gap-3">
																<a
																	href={attachment.url}
																	target="_blank"
																	rel="noreferrer"
																	className="underline truncate"
																>
																	{attachment.name}
																</a>
																<Button
																	type="button"
																	variant="ghost"
																	size="sm"
																	onClick={() =>
																		updateAssignment(
																			occurrenceIndex,
																			assignmentIndex,
																			{
																				attachments: assignment.attachments.filter(
																					(_, idx) => idx !== ai
																				),
																			}
																		)
																	}
																	disabled={disabled}
																>
																	Remove
																</Button>
															</div>
														))}
													</div>
												)}
											</div>

											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() => removeAssignment(occurrenceIndex, assignmentIndex)}
												disabled={disabled}
											>
												Remove Assignment
											</Button>
										</div>
									)
								})}
							</div>
						</div>
					))}
				</div>

				<div className="flex justify-end">
					<Button type="button" onClick={savePlanner} disabled={disabled || saving}>
						{saving ? 'Saving Planner...' : 'Save Planner'}
					</Button>
				</div>

				<div className="rounded-md border p-4 space-y-3">
					<h3 className="font-medium">Course Team Roles</h3>
					{roster.length === 0 && (
						<p className="text-sm text-muted-foreground">
							No enrolled members yet.
						</p>
					)}
					{roster.map((member) => (
						<div
							key={member.userId}
							className="grid gap-2 md:grid-cols-[1fr_220px] items-center"
						>
							<div className="text-sm">
								<p className="font-medium">{member.name || member.email || member.userId}</p>
								<p className="text-muted-foreground text-xs">{member.userId}</p>
							</div>
							<select
								className="border rounded-md h-10 px-3 bg-background"
								value={member.role}
								onChange={(e) =>
									void updateRole(
										member.userId,
										e.target.value as 'organizer' | 'teacher' | 'ta' | 'student'
									)
								}
								disabled={disabled}
							>
								<option value="organizer">Organizer</option>
								<option value="teacher">Teacher</option>
								<option value="ta">TA</option>
								<option value="student">Student</option>
							</select>
						</div>
					))}
				</div>

				<div className="rounded-md border p-4 space-y-3">
					<h3 className="font-medium">Attendance</h3>
					<select
						className="border rounded-md h-10 px-3 bg-background w-full"
						value={selectedAttendanceOccurrenceId}
						onChange={(e) => {
							const occurrenceId = e.target.value
							setSelectedAttendanceOccurrenceId(occurrenceId)
							if (occurrenceId) {
								void loadAttendance(occurrenceId)
							} else {
								setAttendanceRoster([])
							}
						}}
					>
						<option value="">Select saved occurrence</option>
						{occurrences
							.filter((occurrence) => occurrence.id)
							.map((occurrence) => {
								const id = occurrence.id as string
								return (
									<option key={id} value={id}>
										{toLocalInputValue(occurrence.startsAt)}
									</option>
								)
							})}
					</select>

					{attendanceRoster.map((entry, index) => (
						<div
							key={entry.userId}
							className="grid gap-2 md:grid-cols-[1fr_160px_1fr] items-center"
						>
							<p className="text-sm">{entry.name || entry.email || entry.userId}</p>
							<select
								className="border rounded-md h-10 px-3 bg-background"
								value={entry.status ?? ''}
								onChange={(e) =>
									setAttendanceRoster((prev) =>
										prev.map((row, rowIndex) =>
											rowIndex === index
												? {
														...row,
														status: (e.target.value ||
															null) as 'present' | 'absent' | 'late' | null,
												  }
												: row
										)
									)
								}
							>
								<option value="">Unmarked</option>
								<option value="present">Present</option>
								<option value="late">Late</option>
								<option value="absent">Absent</option>
							</select>
							<Input
								placeholder="Optional notes"
								value={entry.notes ?? ''}
								onChange={(e) =>
									setAttendanceRoster((prev) =>
										prev.map((row, rowIndex) =>
											rowIndex === index
												? { ...row, notes: e.target.value }
												: row
										)
									)
								}
							/>
						</div>
					))}

					<div className="flex justify-end">
						<Button
							type="button"
							onClick={saveAttendance}
							disabled={!selectedAttendanceOccurrenceId || savingAttendance}
						>
							{savingAttendance ? 'Saving Attendance...' : 'Save Attendance'}
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
