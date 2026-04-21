import Link from 'next/link'
import { Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { supabaseDb as db } from '@/db'

interface PageProps {
	params: Promise<{ locale: string }>
}

export default async function AdminLearningPage({ params }: PageProps) {
	const { locale } = await params
	const lessons = await db.query.lessons.findMany({
		with: {
			courseLessons: {
				with: {
					course: true,
				},
			},
			targetLanguage: true,
			organization: true,
			moduleAssignments: true,
		},
		orderBy: (lessons, { asc }) => [
			asc(lessons.number),
			asc(lessons.title),
		],
	})

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-gradient-to-br from-sky-50 via-background to-emerald-50 p-6 shadow-sm md:flex-row md:items-end md:justify-between">
				<div>
					<p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">
						Learning
					</p>
					<h1 className="mt-2 font-[family:var(--font-eczar)] text-4xl text-balance">
						Lessons
					</h1>
					<p className="mt-3 max-w-2xl text-sm text-muted-foreground">
						A simple list of every lesson in the new learning model.
					</p>
				</div>
				<Button asChild>
					<Link href={`/${locale}/admin/learning/create`}>
						<Plus className="h-4 w-4" />
						New Lesson
					</Link>
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>All Lessons</CardTitle>
					<CardDescription>
						View lesson details or update the lesson form.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>No.</TableHead>
								<TableHead>Title</TableHead>
								<TableHead>Courses</TableHead>
								<TableHead>Language</TableHead>
								<TableHead>Modules</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
								{lessons.map((lesson) => {
									const readHref = `/${locale}/admin/learning/${lesson.id}/read`

									return (
										<TableRow key={lesson.id} className="cursor-pointer">
											<TableCell>
												<Link href={readHref} className="block py-1">
													{lesson.number}
													{lesson.part ? ` ${lesson.part}` : ''}
												</Link>
											</TableCell>
											<TableCell className="font-medium">
												<Link href={readHref} className="block py-1">
													{lesson.title}
												</Link>
											</TableCell>
											<TableCell>
												<Link href={readHref} className="block py-1">
													{lesson.courseLessons.length
														? lesson.courseLessons
																.map((assignment) => assignment.course.title)
																.join(', ')
														: 'No courses'}
												</Link>
											</TableCell>
											<TableCell>
												<Link href={readHref} className="block py-1">
													{lesson.targetLanguage?.name ?? 'No language'}
												</Link>
											</TableCell>
											<TableCell>
												<Link href={readHref} className="block py-1">
													<Badge variant="secondary">
														{lesson.moduleAssignments.length}
													</Badge>
												</Link>
											</TableCell>
											<TableCell>
												<div className="flex justify-end gap-2">
													<Button asChild size="sm" variant="outline">
														<Link
															href={`/${locale}/admin/learning/${lesson.id}/update`}
														>
															Update
														</Link>
													</Button>
													<Button
														asChild
														size="icon"
														variant="destructive"
														className="h-8 w-8"
													>
														<Link
															href={`/${locale}/admin/learning/${lesson.id}/delete`}
															aria-label={`Delete ${lesson.title}`}
															title={`Delete ${lesson.title}`}
														>
															<Trash2 className="h-4 w-4" />
															<span className="sr-only">Delete</span>
														</Link>
													</Button>
												</div>
											</TableCell>
										</TableRow>
									)
								})}
							{lessons.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={6}
										className="py-10 text-center text-muted-foreground"
									>
										No lessons yet. Create the first one.
									</TableCell>
								</TableRow>
							) : null}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	)
}
