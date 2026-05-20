'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import MembersTable from './members-table'
import StudyGroupCoursesSection from './study-group-courses-section'

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
					<Link href={`/study-group/${studyGroup.id}/messages`}>
						<Button>Open Messageboard</Button>
					</Link>
				</div>
			</div>

			<StudyGroupCoursesSection
				studyGroupId={studyGroup.id}
				initialCourses={studyGroup.courses ?? []}
				canManage={isInstructor}
			/>

			<MembersTable studyGroup={studyGroup} />
		</div>
	)
}
