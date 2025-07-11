import Link from 'next/link'
import Image from 'next/image'

import { quests } from '@/constants'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

type Props = {
	points: number
	userChallengeData: {
		activeLesson:
			| {
					id: number
					title: string
					order: number
					unitId: number
					unit: {
						id: number
						title: string
						description: string
						courseId: number
						order: number
					}
					challenges: {
						id: number
						order: number
						challengeProgress: {
							completed: boolean
						}[]
					}[]
			  }
			| undefined
		activeLessonId: number | undefined
		unitsInActiveCourse: {
			id: number
			title: string
			order: number
			courseId: number
			lessons: {
				id: number
				title: string
				order: number
				unitId: number
				challenges: {
					id: number
					order: number
					challengeProgress: {
						completed: boolean
					}[]
				}[]
			}[]
		}[]
	} | null
}

export const Quests = ({ points, userChallengeData }: Props) => {
	if (!userChallengeData) return null

	const firstIncompleteUnit = userChallengeData.unitsInActiveCourse.find(
		(unit) => {
			const totalChallenges = unit.lessons.reduce(
				(acc, lesson) => acc + lesson.challenges.length,
				0
			)

			const completedChallenges = unit.lessons.reduce((acc, lesson) => {
				return (
					acc +
					lesson.challenges.filter((challenge) =>
						challenge.challengeProgress?.some((p) => p.completed)
					).length
				)
			}, 0)

			return completedChallenges < totalChallenges
		}
	)

	return (
		<div className="border-2 rounded-xl p-4 space-y-6">
			<div className="flex items-center justify-between w-full">
				<h3 className="font-bold text-lg">Quests</h3>
				<Link href="/quests">
					<Button size="sm" variant="primaryOutline">
						View all
					</Button>
				</Link>
			</div>

			{/* Global Quests */}
			{/* Global Quests (only first incomplete) */}
			<ul className="space-y-4">
				{(() => {
					const firstIncompleteQuest = quests.find((quest) => {
						const progress = (points / quest.value) * 100
						return progress < 100
					})

					if (!firstIncompleteQuest) {
						return (
							<p className="text-green-700 text-sm font-semibold">
								🎯 All quests completed!
							</p>
						)
					}

					const progress = (points / firstIncompleteQuest.value) * 100

					return (
						<div
							className="flex items-center w-full gap-x-3"
							key={firstIncompleteQuest.title}
						>
							<Image src="/points.svg" alt="Points" width={40} height={40} />
							<div className="flex flex-col gap-y-2 w-full">
								<p className="text-neutral-700 text-sm font-bold">
									{firstIncompleteQuest.title}
								</p>
								<Progress value={progress} className="h-2" />
							</div>
						</div>
					)
				})()}
			</ul>

			{/* Show only first incomplete unit */}
			{firstIncompleteUnit ? (
				<div className="pt-4 space-y-4">
					{(() => {
						const unit = firstIncompleteUnit
						const totalChallenges = unit.lessons.reduce(
							(acc, lesson) => acc + lesson.challenges.length,
							0
						)

						const completedChallenges = unit.lessons.reduce((acc, lesson) => {
							return (
								acc +
								lesson.challenges.filter((challenge) =>
									challenge.challengeProgress?.some((p) => p.completed)
								).length
							)
						}, 0)

						const progress =
							totalChallenges > 0
								? (completedChallenges / totalChallenges) * 100
								: 0

						return (
							<div key={unit.id} className="flex items-center w-full gap-x-3">
								<Image src="/points.svg" alt="Unit" width={40} height={40} />
								<div className="flex flex-col gap-y-2 w-full">
									<p className="text-sm font-bold text-neutral-700">
										Complete {unit.title.match(/Unit\s*\d+/)?.[0] ?? unit.title}
									</p>
									<Progress value={progress} className="h-2" />
								</div>
							</div>
						)
					})()}
				</div>
			) : (
				<div className="pt-4 text-green-700 text-sm font-semibold">
					🎉 All units complete!
				</div>
			)}

			{/* Full Course Progress */}
			<div className="pt-4 space-y-1">
				{(() => {
					const allUnits = userChallengeData.unitsInActiveCourse

					const allLessons = allUnits.flatMap((unit) => unit.lessons)

					const totalLessons = allLessons.length

					const completedLessons = allLessons.filter((lesson) => {
						const totalChallenges = lesson.challenges.length
						const completedChallenges = lesson.challenges.filter((challenge) =>
							challenge.challengeProgress?.some((p) => p.completed)
						).length
						return (
							totalChallenges > 0 && completedChallenges === totalChallenges
						)
					}).length

					const courseProgress =
						totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0

					return (
						<div className="flex items-center w-full gap-x-3">
							<Image src="/points.svg" alt="Course" width={40} height={40} />
							<div className="flex flex-col gap-y-2 w-full">
								<p className="text-sm font-bold text-neutral-700">
									Complete All
								</p>
								<Progress value={courseProgress} className="h-2" />
								{/* <p className="text-xs text-gray-500">
									{completedLessons} of {totalLessons} lessons completed
								</p> */}
							</div>
						</div>
					)
				})()}
			</div>
			<div className="mt-4">
				<Link href="/leaderboard">
					<Button size="sm" variant="primaryOutline">
						View Leaderboard
					</Button>
				</Link>
			</div>
		</div>
	)
}
