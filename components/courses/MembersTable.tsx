'use client'
import { Button } from '../ui/button'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { CourseWithEnrollments } from '@/db/queries/courses'

// function formatTimeAgo(dateString: string) {
// 	const date = new Date(dateString)
// 	const diff = Date.now() - date.getTime()
// 	const days = Math.floor(diff / (1000 * 60 * 60 * 24))
// 	if (days <= 0) return 'today'
// 	if (days === 1) return '1 day ago'
// 	return `${days} days ago`
// }

export default function MembersTable({
	locale,
	course,
}: {
	locale: string
	course: CourseWithEnrollments
}) {
	return (
		<div className="p-4 border rounded-lg shadow-sm bg-gray-50 relative">
			<div className="flex justify-between items-center mb-4">
				<h2 className="font-semibold text-lg">👥 Members</h2>
				<Link href={`/${locale}/${course.courseCode}/messages`}>
					<Button size="sm">Messageboard</Button>
				</Link>
			</div>

			<div className="overflow-x-auto">
				<table className="min-w-full border-collapse">
					<thead>
						<tr className="text-left text-sm text-gray-600 border-b">
							<th className="py-2">Profile</th>
							<th className="py-2">Name</th>
							<th className="py-2">Current Lesson</th>
							<th className="py-2">Last Sign In</th>
						</tr>
					</thead>
					<tbody>
						{course.enrollments.slice(0, 5).map((e) => {
							// const isHebrew = /[\u0590-\u05FF]/.test(e.user.userName)
							// const lastSeen = m.user.lastSeen
							// 	? formatTimeAgo(m.user.lastSeen)
							// 	: '—'
							return (
								<tr key={e.student.id} className="border-b hover:bg-gray-100">
									<td className="py-2">
										<div className="relative w-10 h-10">
											<Avatar
												key={e.student.id}
												data-slot="avatar"
												className="h-8 w-8"
											>
												<AvatarImage
													src={e.student.image || '/default-avatar.png'}
													alt={e.student.name || 'Student'}
												/>
												<AvatarFallback>
													{(e.student.name || 'U').charAt(0).toUpperCase()}
												</AvatarFallback>
											</Avatar>
										</div>
									</td>
									<td className="py-2">
										<span>{e.student.name}</span>
										{/* <span
											className={
												isHebrew
													? 'font-serif text-4xl text-gray-800'
													: 'text-gray-800 text-lg font-medium'
											}
										>
											{m.user.userName}
										</span> */}
									</td>
									<td className="py-2 text-gray-700">
										{/* {m.user.activeLessonNumber
											? `Lesson ${m.user.activeLessonNumber}`
											: '—'} */}
									</td>
									<td className="py-2 text-gray-500"></td>
									{/* <td className="py-2 text-gray-500">{lastSeen}</td> */}
								</tr>
							)
						})}
					</tbody>
				</table>
			</div>
		</div>
	)
}
