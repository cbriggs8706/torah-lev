// components/leaderboards/GreekLeaderboard.tsx
import { Ribbon } from '@/components/ribbon'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { Shield } from '@/components/shield'
import { Separator } from '@/components/ui/separator'
import { getTopTwentyUsers } from '@/db/queries'
// If you have a Greek-specific query, swap it in:
// import { getTopTwentyGreekUsers } from '@/db/queries'
import { scoreAndRank, LeaderboardUser, containsGreek } from '@/lib/leaderboard'

export default async function GreekLeaderboard() {
	// const raw = await getTopTwentyGreekUsers()
	const raw = await getTopTwentyUsers() // placeholder until you add a Greek-filtered query
	const users = raw as LeaderboardUser[]

	const { scored, ranks } = scoreAndRank(users)

	return (
		<div className="w-full">
			<h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
				Leaderboard — Ελληνικά
			</h1>
			<Separator className="mb-4 h-0.5 rounded-full" />

			<table className="hidden md:table w-full border-collapse mb-8">
				<thead>
					<tr className="text-left text-gray-600">
						<th className="px-4 py-2">Rank</th>
						<th className="px-4 py-2">Avatar</th>
						<th className="px-4 py-2">Username</th>
						<th className="px-4 py-2 text-center w-[64px]">Lesson</th>
						<th className="px-4 py-2 text-right">Points</th>
					</tr>
				</thead>
				<tbody>
					{scored.map((u, i) => (
						<tr key={u.userId} className="hover:bg-gray-200/50 transition">
							<td className="px-4 py-2">
								<Ribbon rank={ranks[i]} />
							</td>
							<td className="px-4 py-2">
								<Avatar className="h-12 w-12 border bg-sky-500">
									<AvatarImage className="object-cover" src={u.userImageSrc} />
								</Avatar>
							</td>
							<td
								className={`px-4 py-2 text-neutral-800 ${
									containsGreek(u.userName) ? 'text-2xl font-serif' : ''
								}`}
							>
								{u.userName}
							</td>
							<td className="px-4 py-2 text-center">
								<Shield lessonNumber={u.activeLessonNumber} />
							</td>
							<td className="px-4 py-2 text-right text-muted-foreground">
								{u.points} XP
							</td>
						</tr>
					))}
				</tbody>
			</table>

			{/* Mobile */}
			<div className="flex flex-col gap-4 md:hidden">
				{scored.map((u, i) => (
					<div
						key={u.userId}
						className="flex items-center p-4 rounded-lg bg-gray-50 shadow-sm"
					>
						<Ribbon rank={ranks[i]} />
						<Avatar className="h-10 w-10 mx-3">
							<AvatarImage src={u.userImageSrc} />
						</Avatar>
						<div className="flex flex-col flex-1">
							<p
								className={`${
									containsGreek(u.userName) ? 'text-xl font-serif' : ''
								} font-bold`}
							>
								{u.userName}
							</p>
							<p>
								Lesson: {u.activeLessonNumber} | {u.points} XP
							</p>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
