import Image from 'next/image'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import MembersTable from './members-table'
import StudyGroupCoursesSection from './study-group-courses-section'
import { cn } from '@/lib/utils'
import type { StudyGroupLessonFlow } from '@/lib/study-group-lesson-flow'

export default function StudyGroupDashboard({
	studyGroup,
	currentUserId,
	lessonFlows,
}: {
	studyGroup: any
	currentUserId: string
	lessonFlows: StudyGroupLessonFlow[]
}) {
	const instructor = studyGroup.teacher
	const memberCount = studyGroup.members.length
	const isInstructor = currentUserId === studyGroup.teacherId

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

			<div className="space-y-4">
				<div>
					<h2 className="text-2xl font-semibold text-slate-900">
						Scheduled Lesson Flow
					</h2>
					<p className="text-sm text-slate-600">
						Each lesson keeps the same public-course style: lesson header first,
						then the activity cards underneath with completion progress.
					</p>
				</div>

				{lessonFlows.length > 0 ? (
					<div className="space-y-8">
						{lessonFlows.map((lesson, lessonIndex) => {
							const firstIncompleteIndex = lesson.activities.findIndex(
								(activity) => !activity.completed,
							)
							const lessonProgressPercent =
								lesson.totalCount > 0
									? (lesson.completedCount / lesson.totalCount) * 100
									: 0

							return (
								<section
									key={lesson.id}
									className="space-y-4"
								>
									<div className="overflow-hidden rounded-2xl border border-sky-300 shadow-sm">
										<div className="bg-sky-600 px-5 py-4 text-white">
											<div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
												<div className="space-y-1">
													<p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100">
														{new Date(lesson.classDate).toLocaleString()}
													</p>
													<h3 className="text-2xl font-bold">
														{lesson.title || `Lesson ${lessonIndex + 1}`}
													</h3>
													<p className="text-sm text-sky-50">
														{lesson.groupCourseName
															? `${lesson.groupCourseName}${
																	lesson.platformCourseTitle
																		? ` · ${lesson.platformCourseTitle}`
																		: ''
																}`
															: lesson.platformCourseTitle ?? 'Study group lesson'}
													</p>
												</div>

												<div className="w-full max-w-[310px] rounded-2xl border border-white/20 bg-white/10 p-4 shadow-sm backdrop-blur-sm md:w-[310px]">
													<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-100">
														Progress
													</p>
													<p className="mt-1 text-xl font-bold text-white">
														{lesson.completedCount} of {lesson.totalCount}{' '}
														activities completed
													</p>
													<div className="mt-3 h-3 overflow-hidden rounded-full bg-white/20">
														<div
															className="h-full rounded-full bg-white transition-all duration-500"
															style={{ width: `${lessonProgressPercent}%` }}
														/>
													</div>
												</div>
											</div>
										</div>
									</div>

									{lesson.activities.length > 0 ? (
										<div
											dir="rtl"
											className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
										>
											{lesson.activities.map((activity, activityIndex) => {
												const isCompleted = activity.completed
												const isCurrent =
													firstIncompleteIndex !== -1 &&
													activityIndex === firstIncompleteIndex

												const cardContent = (
													<div
														dir="ltr"
														className={cn(
															'relative flex min-h-[220px] flex-col items-center justify-between rounded-3xl border-2 border-b-4 p-3 text-center transition duration-200',
															isCurrent &&
																'border-sky-400 bg-sky-100 shadow-md',
															isCompleted &&
																!isCurrent &&
																'border-emerald-300 bg-gradient-to-b from-emerald-50 via-white to-emerald-100/70 shadow-[0_18px_40px_-28px_rgba(16,185,129,0.55)]',
															!isCurrent &&
																!isCompleted &&
																'border-slate-200 bg-white hover:bg-black/5 hover:shadow-md',
														)}
													>
														{isCurrent ? (
															<div className="absolute -top-3 inset-x-0 z-20 mx-auto w-fit rounded-xl border-2 bg-white px-3 py-2.5 font-bold uppercase tracking-wide text-sky-600 animate-bounce">
																Start
																<div className="absolute left-1/2 -bottom-2 h-0 w-0 -translate-x-1/2 transform border-x-8 border-x-transparent border-t-8" />
															</div>
														) : isCompleted ? (
															<div className="absolute -top-3 inset-x-0 z-20 mx-auto w-fit rounded-full border border-emerald-200 bg-emerald-600 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white shadow-md shadow-emerald-200/60">
																<div className="flex items-center gap-1.5">
																	<CheckCircle2 className="h-3.5 w-3.5" />
																	<span>Completed</span>
																</div>
															</div>
														) : null}

														<div className="relative flex h-[92px] w-[92px] items-center justify-center">
															<Image
																src={activity.iconSrc}
																alt={activity.label}
																height={70}
																width={93}
																className={`h-[72px] w-[72px] object-contain drop-shadow-md ${
																	isCompleted
																		? 'drop-shadow-[0_12px_20px_rgba(16,185,129,0.15)]'
																		: ''
																}`}
															/>
														</div>

														<div className="space-y-2">
															<p className="text-center font-bold text-neutral-700">
																{activity.label}
															</p>
															<p className="text-xs text-slate-500">
																Open this lesson&apos;s{' '}
																{activity.label.toLowerCase()}.
															</p>
														</div>

														<div
															className={cn(
																'w-full rounded-lg px-3 py-2 text-xs font-semibold transition-colors',
																isCurrent
																	? 'bg-sky-600 text-white'
																	: isCompleted
																		? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200/60'
																		: 'bg-slate-100 text-slate-600',
															)}
														>
															{isCurrent
																? 'Start here'
																: isCompleted
																	? 'Review'
																	: 'Not started'}
														</div>
													</div>
												)

												return (
													<Link
														key={`${lesson.id}-${activity.key}`}
														href={activity.href}
														className="group"
													>
														{cardContent}
													</Link>
												)
											})}
										</div>
									) : (
										<div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-sm text-slate-500">
											No activity links are available for this lesson yet.
										</div>
									)}
								</section>
							)
						})}
					</div>
				) : (
					<div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-sm text-slate-500">
						No scheduled lessons have been added yet.
					</div>
				)}
			</div>
		</div>
	)
}
