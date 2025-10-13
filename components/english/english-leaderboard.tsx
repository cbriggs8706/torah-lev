// components/leaderboards/EnglishLeaderboard.tsx
import { Ribbon } from '@/components/ribbon'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { Shield } from '@/components/shield'
import { Separator } from '@/components/ui/separator'
import { getTopTwentyUsers } from '@/db/queries'

const parseLessonNumber = (lesson: string | null): number => {
	if (!lesson) return 0
	const match = lesson.match(/^(\d+)([a-z])?$/i)
	if (!match) return 0
	const base = parseInt(match[1], 10)
	const part = match[2]?.toLowerCase()
	if (part === 'a') return base - 0.25
	if (part === 'b') return base - 0.125
	return base
}

export default async function EnglishLeaderboard({ users }: { users: any[] }) {
	const leaderboard = users || []

	// Sort directly by points
	const scored = leaderboard
		.map((u: any) => ({
			...u,
			score: u.points || 0,
		}))
		.sort((a: any, b: any) => b.score - a.score)

	// Assign ranks (ties share rank)
	const ranks: number[] = []
	scored.forEach((u: any, i: number) => {
		if (i === 0) ranks.push(1)
		else if (u.score === scored[i - 1].score) ranks.push(ranks[i - 1])
		else ranks.push(i + 1)
	})
	// const maxPoints = Math.max(...leaderboard.map((u: any) => u.points || 0), 0)
	// const maxLesson = Math.max(
	// 	...leaderboard.map((u: any) =>
	// 		parseLessonNumber(u.activeLessonNumber || '0')
	// 	),
	// 	0
	// )

	// const scored = leaderboard
	// 	.map((u: any) => {
	// 		const np = maxPoints ? (u.points || 0) / maxPoints : 0
	// 		const nl = maxLesson
	// 			? parseLessonNumber(u.activeLessonNumber || '0') / maxLesson
	// 			: 0
	// 		return { ...u, score: 0.5 * np + 0.5 * nl }
	// 	})
	// 	.sort((a: any, b: any) => b.score - a.score)

	// const ranks: number[] = []
	// scored.forEach((u: any, i: number) => {
	// 	if (i === 0) ranks.push(1)
	// 	else if (u.score === scored[i - 1].score) ranks.push(ranks[i - 1])
	// 	else ranks.push(i + 1)
	// })

	return (
		<div className="w-full">
			<h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
				Leaderboard
			</h1>
			<Separator className="mb-4 h-0.5 rounded-full" />

			<table className="hidden md:table w-full border-collapse mb-8">
				<thead>
					<tr className="text-left text-gray-600">
						<th className="px-4 py-2">Rank</th>
						<th className="px-4 py-2">Avatar</th>
						<th className="px-4 py-2">Username</th>
						{/* <th className="px-4 py-2 text-center w-[64px]">Lesson</th> */}
						<th className="px-4 py-2 text-right">Points</th>
					</tr>
				</thead>
				<tbody>
					{scored.map((u: any, i: number) => (
						<tr key={u.userId} className="hover:bg-gray-200/50 transition">
							<td className="px-4 py-2">
								<Ribbon rank={ranks[i]} />
							</td>
							<td className="px-4 py-2">
								<Avatar className="h-12 w-12 border bg-sky-600">
									<AvatarImage className="object-cover" src={u.userImageSrc} />
								</Avatar>
							</td>
							<td className="px-4 py-2 text-neutral-800">{u.userName}</td>
							{/* <td className="px-4 py-2 text-center">
								<Shield lessonNumber={u.activeLessonNumber} />
							</td> */}
							<td className="px-4 py-2 text-right text-muted-foreground">
								{u.points} XP
							</td>
						</tr>
					))}
				</tbody>
			</table>

			{/* Mobile */}
			<div className="flex flex-col gap-4 md:hidden">
				{scored.map((u: any, i: number) => (
					<div
						key={u.userId}
						className="flex items-center p-4 rounded-lg bg-gray-50 shadow-sm"
					>
						<Ribbon rank={ranks[i]} />
						<Avatar className="h-10 w-10 mx-3">
							<AvatarImage src={u.userImageSrc} />
						</Avatar>
						<div className="flex flex-col flex-1">
							<p className="font-bold">{u.userName}</p>
							<p>{u.points} XP</p>
							{/* <p>
								Lesson: {u.activeLessonNumber} | {u.points} XP
							</p> */}
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
