'use client'
import Image from 'next/image'
import { Button } from '../ui/button'
import Link from 'next/link'

function formatTimeAgo(dateString: string) {
	const date = new Date(dateString)
	const diff = Date.now() - date.getTime()
	const days = Math.floor(diff / (1000 * 60 * 60 * 24))
	if (days <= 0) return 'today'
	if (days === 1) return '1 day ago'
	return `${days} days ago`
}

export default function MembersTable({ studyGroup }: { studyGroup: any }) {
	const instructor = studyGroup.teacher

	return (
		<div className="space-y-4">
			<div className="rounded-lg border bg-white p-4 shadow-sm">
				<h2 className="mb-3 font-semibold text-lg">Group Leader</h2>
				<div className="flex items-center gap-3">
					<div className="relative h-12 w-12 overflow-hidden rounded-full border">
						<Image
							src={instructor.userImageSrc || '/mascot.svg'}
							alt={instructor.userName}
							fill
							sizes="48px"
							className="object-cover"
						/>
					</div>
					<div>
						<p className="font-medium text-gray-900">{instructor.userName}</p>
						<p className="text-sm text-gray-500">Instructor</p>
					</div>
				</div>
			</div>

			<div className="p-4 border rounded-lg shadow-sm bg-gray-50 relative">
				<div className="flex justify-between items-center mb-4">
					<h2 className="font-semibold text-lg">Students</h2>
					<Link href={`/study-group/${studyGroup.id}/messages`}>
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
							{studyGroup.members.map((m: any) => {
								const isHebrew = /[\u0590-\u05FF]/.test(m.user.userName)
								const lastSeen = m.user.lastSeen
									? formatTimeAgo(m.user.lastSeen)
									: '—'
								return (
									<tr key={m.user.userId} className="border-b hover:bg-gray-100">
										<td className="py-2">
											<div className="relative w-10 h-10">
												<Image
													src={m.user.userImageSrc || '/mascot.svg'}
													alt={m.user.userName}
													fill
													className="object-cover rounded-full border"
													sizes="40px"
												/>
											</div>
										</td>
										<td className="py-2">
											<span
												className={
													isHebrew
														? 'font-serif text-4xl text-gray-800'
														: 'text-gray-800 text-lg font-medium'
												}
											>
												{m.user.userName}
											</span>
										</td>
										<td className="py-2 text-gray-700">
											{m.user.activeLessonNumber
												? `Lesson ${m.user.activeLessonNumber}`
												: '—'}
										</td>
										<td className="py-2 text-gray-500">{lastSeen}</td>
									</tr>
								)
							})}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	)
}
