'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import CourseThreadsWorkspace from '@/components/courses/CourseThreadsWorkspace'

type AssignmentView = {
	id: string
	title: string
	sourceType: 'existing_lesson' | 'existing_chapter' | 'custom'
	chapterRef: string | null
	contentHtml: string | null
	attachments: Array<{
		path: string
		url: string
		name: string
		size: number
		mimeType: string
	}>
	isCompleted: boolean
}

type OccurrenceView = {
	id: string
	startsAt: string
	endsAt: string | null
	timezone: string
	title: string | null
	notes: string | null
	isCanceled: boolean
	attendanceEnabled: boolean
	assignments: AssignmentView[]
}

export default function CourseStudentWorkspace({
	courseId,
	currentUserId,
	messageCenterHref,
}: {
	courseId: string
	currentUserId: string
	messageCenterHref?: string
}) {
	const [loading, setLoading] = React.useState(true)
	const [occurrences, setOccurrences] = React.useState<OccurrenceView[]>([])
	const [pendingId, setPendingId] = React.useState<string | null>(null)

	const totalAssignments = occurrences.reduce(
		(total, occurrence) => total + occurrence.assignments.length,
		0
	)
	const completedAssignments = occurrences.reduce(
		(total, occurrence) =>
			total + occurrence.assignments.filter((assignment) => assignment.isCompleted).length,
		0
	)
	const progressPercent =
		totalAssignments === 0
			? 0
			: Math.round((completedAssignments / totalAssignments) * 100)
	const canToggleCompletion = Boolean(currentUserId)

	const loadHomework = React.useCallback(async () => {
		setLoading(true)
		try {
			const res = await fetch(`/api/courses/${courseId}/homework`, {
				cache: 'no-store',
			})
			if (!res.ok) throw new Error('Failed to load course workspace')
			const data = await res.json()
			setOccurrences(data.occurrences ?? [])
		} catch (error) {
			console.error(error)
			toast.error('Could not load workspace')
		} finally {
			setLoading(false)
		}
	}, [courseId])

	React.useEffect(() => {
		void loadHomework()
	}, [loadHomework])

	async function toggleCompletion(assignmentId: string, nextChecked: boolean) {
		setPendingId(assignmentId)
		setOccurrences((prev) =>
			prev.map((occurrence) => ({
				...occurrence,
				assignments: occurrence.assignments.map((assignment) =>
					assignment.id === assignmentId
						? { ...assignment, isCompleted: nextChecked }
						: assignment
				),
			}))
		)

		try {
			const res = await fetch(
				`/api/courses/${courseId}/assignments/${assignmentId}/completion`,
				{
					method: nextChecked ? 'POST' : 'DELETE',
				}
			)
			if (!res.ok) throw new Error('Failed to update completion')
		} catch (error) {
			console.error(error)
			toast.error('Could not update assignment completion')
			setOccurrences((prev) =>
				prev.map((occurrence) => ({
					...occurrence,
					assignments: occurrence.assignments.map((assignment) =>
						assignment.id === assignmentId
							? { ...assignment, isCompleted: !nextChecked }
							: assignment
					),
				}))
			)
		} finally {
			setPendingId(null)
		}
	}

	if (loading) {
		return <div className="text-sm text-muted-foreground">Loading workspace...</div>
	}

	return (
		<div className="space-y-4">
			<div className="grid gap-3 md:grid-cols-3">
				<Card>
					<CardHeader>
						<CardTitle className="text-sm">Upcoming Sessions</CardTitle>
					</CardHeader>
					<CardContent className="text-2xl font-semibold">
						{occurrences.filter((occurrence) => new Date(occurrence.startsAt) > new Date()).length}
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="text-sm">Assignments Completed</CardTitle>
					</CardHeader>
					<CardContent className="text-2xl font-semibold">
						{completedAssignments}/{totalAssignments}
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="text-sm">Progress</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						<Progress value={progressPercent} />
						<p className="text-sm text-muted-foreground">{progressPercent}% complete</p>
					</CardContent>
				</Card>
			</div>

			{messageCenterHref && (
				<div className="flex justify-end">
					<Button asChild variant="outline" size="sm">
						<Link href={messageCenterHref}>Open Message Center</Link>
					</Button>
				</div>
			)}

			<Tabs defaultValue="schedule" className="space-y-4">
			<TabsList>
				<TabsTrigger value="schedule">Schedule</TabsTrigger>
				<TabsTrigger value="homework">Homework</TabsTrigger>
				<TabsTrigger value="progress">Progress</TabsTrigger>
				<TabsTrigger value="messages">Messages</TabsTrigger>
			</TabsList>

			<TabsContent value="schedule" className="space-y-3">
				{occurrences.length === 0 && (
					<p className="text-sm text-muted-foreground">No schedule published yet.</p>
				)}
				{occurrences.map((occurrence) => (
					<Card key={occurrence.id}>
						<CardHeader>
							<CardTitle className="text-base">
								{occurrence.title || format(new Date(occurrence.startsAt), 'PPP p')}
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2 text-sm">
							<p>
								{format(new Date(occurrence.startsAt), 'PPP p')}
								{occurrence.endsAt
									? ` - ${format(new Date(occurrence.endsAt), 'p')}`
									: ''}
							</p>
							<p className="text-muted-foreground">{occurrence.timezone}</p>
							{occurrence.isCanceled && (
								<p className="font-medium text-destructive">Canceled</p>
							)}
							{occurrence.attendanceEnabled && (
								<p className="text-muted-foreground">
									Attendance tracking enabled
								</p>
							)}
							{occurrence.notes && <p>{occurrence.notes}</p>}
						</CardContent>
					</Card>
				))}
			</TabsContent>

			<TabsContent value="homework" className="space-y-3">
				{occurrences.length === 0 && (
					<p className="text-sm text-muted-foreground">No homework assigned yet.</p>
				)}
				{occurrences.map((occurrence) => (
					<Card key={`${occurrence.id}-homework`}>
						<CardHeader>
							<CardTitle className="text-base">
								{occurrence.title || format(new Date(occurrence.startsAt), 'PPP p')}
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							{occurrence.assignments.length === 0 && (
								<p className="text-sm text-muted-foreground">
									No assignments for this session.
								</p>
							)}
							{occurrence.assignments.map((assignment) => (
									<div
										key={assignment.id}
										className="rounded-md border p-3 space-y-2 text-sm"
									>
										<div className="flex items-center gap-2">
											<Checkbox
												checked={assignment.isCompleted}
												disabled={pendingId === assignment.id || !canToggleCompletion}
												onCheckedChange={(checked) =>
													void toggleCompletion(assignment.id, checked === true)
												}
											/>
										<p className="font-medium">{assignment.title}</p>
									</div>
									{assignment.chapterRef && (
										<p className="text-muted-foreground">
											Reference: {assignment.chapterRef}
										</p>
									)}
									{assignment.contentHtml && (
										<div
											className="prose prose-sm max-w-none"
											dangerouslySetInnerHTML={{ __html: assignment.contentHtml }}
										/>
									)}
									{assignment.attachments.length > 0 && (
										<div className="space-y-1">
											<p className="text-muted-foreground">Attachments</p>
											<div className="space-y-1">
												{assignment.attachments.map((attachment) => (
													<a
														key={attachment.path}
														href={attachment.url}
														target="_blank"
														rel="noreferrer"
														className="block underline truncate"
													>
														{attachment.name}
													</a>
												))}
											</div>
										</div>
									)}
								</div>
								))}
								{!canToggleCompletion && (
									<p className="text-xs text-muted-foreground">
										Log in to track completion.
									</p>
								)}
							</CardContent>
						</Card>
					))}
				</TabsContent>

			<TabsContent value="progress">
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Homework Progress</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<p className="text-sm">
							{completedAssignments} of {totalAssignments} completed
						</p>
						<Progress value={progressPercent} />
						<p className="text-sm text-muted-foreground">{progressPercent}% complete</p>
					</CardContent>
				</Card>
			</TabsContent>

			<TabsContent value="messages">
				<CourseThreadsWorkspace courseId={courseId} currentUserId={currentUserId} />
			</TabsContent>
			</Tabs>
		</div>
	)
}
