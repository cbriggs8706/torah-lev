import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { eq } from 'drizzle-orm'
import { ArrowRight, BookOpenCheck, UsersRound } from 'lucide-react'
import { JoinStudyGroupButton } from '@/components/learning/JoinStudyGroupButton'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { authOptions } from '@/lib/auth'
import { supabaseDb as db } from '@/db'
import { studyGroupMemberships } from '@/db/schema/tables/study_groups'

interface PageProps {
	params: Promise<{ locale: string }>
}

export default async function StudyGroupsPage({ params }: PageProps) {
	const { locale } = await params
	const session = await getServerSession(authOptions)

	if (!session?.user?.id) redirect(`/${locale}/login`)

	const [studyGroups, memberships] = await Promise.all([
		db.query.studyGroups.findMany({
			with: {
				activeCourse: true,
				studyGroupCourses: {
					with: {
						course: true,
					},
					orderBy: (studyGroupCourses, { asc }) => [
						asc(studyGroupCourses.sortOrder),
					],
				},
			},
			orderBy: (studyGroups, { asc }) => [asc(studyGroups.title)],
		}),
		db.query.studyGroupMemberships.findMany({
			where: eq(studyGroupMemberships.userId, session.user.id),
		}),
	])

	const joinedIds = new Set(
		memberships.map((membership) => membership.studyGroupId)
	)

	return (
		<div className="space-y-6">
			<section className="tl-scroll-stage rounded-[2.4rem]">
				<div className="tl-scroll-body space-y-4 px-6 py-8 md:px-10">
					<p className="tl-kicker">Study Groups</p>
					<h1 className="tl-heading max-w-3xl text-4xl leading-tight font-semibold text-balance md:text-5xl">
						Join a learning community.
					</h1>
					<p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
						Choose the study group you belong to. Joining connects your account
						to that group so your current and future courses can follow you.
					</p>
				</div>
			</section>

			<div className="grid gap-4 lg:grid-cols-2">
				{studyGroups.map((group) => (
					<Card
						key={group.id}
						className="tl-panel rounded-[1.8rem] border-border/70 py-0"
					>
						<CardHeader className="gap-3 px-6 pt-6">
							<div className="flex items-start justify-between gap-4">
								<div>
									<CardTitle className="tl-heading text-3xl font-semibold">
										<Link
											href={`/${locale}/study-groups/${group.id}`}
											className="hover:text-primary"
										>
											{group.title}
										</Link>
									</CardTitle>
									<CardDescription className="mt-2 text-base leading-7">
										{group.activeCourse
											? `Current course: ${group.activeCourse.title}`
											: 'No active course has been selected yet.'}
									</CardDescription>
								</div>
								<div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
									<UsersRound className="size-5" />
								</div>
							</div>
						</CardHeader>
						<CardContent className="space-y-5 px-6 pb-6">
							<div className="space-y-2">
								<p className="text-sm font-semibold">Current course</p>
								<div className="space-y-2">
									{group.activeCourse ? (
										<div
											className="flex items-center gap-2 rounded-2xl border border-border/70 bg-background/80 px-3 py-2 text-sm"
										>
											<BookOpenCheck className="size-4 text-primary" />
											<span>{group.activeCourse.title}</span>
										</div>
									) : (
										<p className="text-sm text-muted-foreground">
											No current course has been assigned yet.
										</p>
									)}
								</div>
							</div>

							<div className="flex flex-wrap items-center gap-3">
								<Button asChild variant="outline">
									<Link href={`/${locale}/study-groups/${group.id}`}>
										View group
										<ArrowRight className="size-4" />
									</Link>
								</Button>
								<JoinStudyGroupButton
									studyGroupId={group.id}
									joined={joinedIds.has(group.id)}
								/>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{studyGroups.length === 0 ? (
				<Card className="tl-panel rounded-[1.8rem] border-border/70">
					<CardContent className="p-6 text-muted-foreground">
						No study groups are available yet.
					</CardContent>
				</Card>
			) : null}
		</div>
	)
}
