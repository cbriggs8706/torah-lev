// lib/leaderboard.ts
export const parseLessonNumber = (lesson: string | null): number => {
	if (!lesson) return 0
	const match = lesson.match(/^(\d+)([a-z])?$/i)
	if (!match) return 0
	const base = parseInt(match[1], 10)
	const part = match[2]?.toLowerCase()
	if (part === 'a') return base - 0.25
	if (part === 'b') return base - 0.125
	return base
}

export type LeaderboardUser = {
	userId: string
	userName: string
	userImageSrc: string
	points: number
	activeLessonNumber: string | null
	lastSeen?: Date | null
}

export function scoreAndRank(users: LeaderboardUser[]) {
	const maxPoints = Math.max(...users.map((u) => u.points || 0), 0)
	const maxLesson = Math.max(
		...users.map((u) => parseLessonNumber(u.activeLessonNumber || '0')),
		0
	)

	const scored = users
		.map((u) => {
			const np = maxPoints ? (u.points || 0) / maxPoints : 0
			const nl = maxLesson
				? parseLessonNumber(u.activeLessonNumber || '0') / maxLesson
				: 0
			return { ...u, score: 0.5 * np + 0.5 * nl }
		})
		.sort((a, b) => b.score - a.score)

	const ranks: number[] = []
	scored.forEach((u, i) => {
		if (i === 0) ranks.push(1)
		else if (u.score === scored[i - 1].score) ranks.push(ranks[i - 1])
		else ranks.push(i + 1)
	})

	return { scored, ranks }
}

// Optional script-detectors for stylistic tweaks (fonts/sizes)
export const containsHebrew = (s: string) => /[\u0590-\u05FF]/.test(s)
export const containsGreek = (s: string) =>
	/[\u0370-\u03FF\u1F00-\u1FFF]/.test(s) // basic + polytonic
