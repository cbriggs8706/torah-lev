'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import MembersTable from './members-table'
import StudyGroupCoursesSection from './study-group-courses-section'
import { getStudyGroupScheduledActivityLinks } from '@/lib/study-group-activities'

export default function StudyGroupDashboard({
	studyGroup,
	currentUserId,
}: {
	studyGroup: any
	currentUserId: string
}) {
	const instructor = studyGroup.teacher
	const memberCount = studyGroup.members.length
	const isInstructor = currentUserId === studyGroup.teacherId
	const scheduleEvents = studyGroup.scheduleEvents ?? []

	return (
		<div className="w-full max-w-2xl mx-auto space-y-6">
			<div className="rounded-xl border bg-sky-50 p-5 shadow-sm">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-center gap-4">
						<div className="relative h-16 w-16 overflow-hidden rounded-full border bg-white">
							<Image
								src={instructor.userImageSrc || '/mascot.svg'}
								alt={instructor.userName}
								fill
								sizes="64px"
								className="object-cover"
							/>
						</div>
						<div className="text-left">
							<p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
								Instructor
							</p>
							<h2 className="text-2xl font-semibold text-slate-900">
								{instructor.userName}
							</h2>
							<p className="text-sm text-slate-600">
								{memberCount} student{memberCount === 1 ? '' : 's'} in this
								group
							</p>
						</div>
					</div>
					<div className="flex flex-wrap gap-2">
						<Link href={`/study-group/${studyGroup.id}/messages`}>
							<Button>Open Messageboard</Button>
						</Link>
						{isInstructor ? (
							<Link href={`/study-group/${studyGroup.id}/settings`}>
								<Button variant="ghost">Group Settings</Button>
							</Link>
						) : null}
					</div>
				</div>
			</div>
			<MembersTable studyGroup={studyGroup} />

			<StudyGroupCoursesSection
				studyGroupId={studyGroup.id}
				initialCourses={studyGroup.courses ?? []}
				canManage={isInstructor}
				allowInlineEditing={false}
				manageHref={`/study-group/${studyGroup.id}/settings`}
			/>

			<div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
				<div className="space-y-1">
					<h2 className="text-xl font-semibold text-slate-900">
						Scheduled Classes
					</h2>
					<p className="text-sm text-slate-600">
						Use these class links when your group leader assigns a lesson for
						the next session.
					</p>
				</div>

				{scheduleEvents.length > 0 ? (
					<div className="space-y-4">
						{scheduleEvents.map((event: any) => {
							const activityLinks = getStudyGroupScheduledActivityLinks(
								event.platformCourseId,
								event.lessonNumber,
							)
							const eventTitle = event.lessonNumber
								? `Lesson ${event.lessonNumber}: ${event.lessonTitle}`
								: event.title || 'Custom class'

							return (
								<div
									key={event.id}
									className="rounded-xl border bg-slate-50 p-4"
								>
									<p className="text-sm font-semibold text-sky-700">
										{new Date(event.classDate).toLocaleString()}
									</p>
									<h3 className="mt-1 text-base font-semibold text-slate-900">
										{eventTitle}
									</h3>
									<p className="mt-1 text-sm text-slate-600">
										{event.groupCourseName}
										{event.platformCourseTitle
											? ` · ${event.platformCourseTitle}`
											: ''}
									</p>
									{event.notes ? (
										<p className="mt-2 text-sm text-slate-600">{event.notes}</p>
									) : null}

									{activityLinks.length > 0 ? (
										<div className="mt-3 flex flex-wrap gap-2">
											{activityLinks.map((activity) => (
												<Link key={activity.key} href={activity.href}>
													<Button variant="ghost" size="sm">
														{activity.label}
													</Button>
												</Link>
											))}
										</div>
									) : (
										<p className="mt-3 text-sm text-slate-500">
											Activity links will appear when this event is tied to a
											supported lesson-based course.
										</p>
									)}
								</div>
							)
						})}
					</div>
				) : (
					<div className="rounded-xl border border-dashed p-6 text-sm text-slate-600">
						No class events have been scheduled yet.
					</div>
				)}
			</div>
		</div>
	)
}
