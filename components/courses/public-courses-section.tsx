'use client'

import { useMemo, useState } from 'react'

import CatalogCard from '@/components/courses/catalog-card'
import { cn } from '@/lib/utils'

export type PublicCourseCard = {
	id: number
	curriculumTitle: string | null
	name: string
	imageUrl: string
	description: string | null
	progress: {
		completed: number
		total: number
	} | null
}

type PublicCoursesSectionProps = {
	courses: PublicCourseCard[]
}

export default function PublicCoursesSection({
	courses,
}: PublicCoursesSectionProps) {
	const [selectedCurriculum, setSelectedCurriculum] = useState('All')

	const curriculumOptions = useMemo(() => {
		const names = new Set(
			courses
				.map((course) => course.curriculumTitle?.trim() ?? '')
				.filter(Boolean),
		)

		return ['All', ...Array.from(names).sort((a, b) => a.localeCompare(b))]
	}, [courses])

	const visibleCourses = useMemo(() => {
		if (selectedCurriculum === 'All') return courses
		return courses.filter(
			(course) => course.curriculumTitle?.trim() === selectedCurriculum,
		)
	}, [courses, selectedCurriculum])

	return (
		<section className="space-y-4">
			<div>
				<h2 className="text-2xl font-semibold text-slate-900">
					Public Courses
				</h2>
				<p className="text-sm text-slate-600">
					Start on your own schedule and set your own target dates.
				</p>
			</div>

			<div className="flex flex-wrap gap-2">
				{curriculumOptions.map((name) => {
					const active = selectedCurriculum === name

					return (
						<button
							key={name}
							type="button"
							onClick={() => setSelectedCurriculum(name)}
							className={cn(
								'rounded-full border px-4 py-2 text-xs transition',
								active
									? 'border-sky-600 bg-sky-600 text-white'
									: 'border-slate-300 bg-gray-200 text-slate-800',
							)}
						>
							{name}
						</button>
					)
				})}
			</div>

			{visibleCourses.length > 0 ? (
				<div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
					{visibleCourses.map((course, index) => {
						const progressPercent = course.progress
							? course.progress.total === 0
								? 100
								: Math.min(
										100,
										Math.round(
											(course.progress.completed / course.progress.total) * 100,
										),
									)
							: 0

						return (
							<div key={`public-${course.id}`} className="space-y-3">
								<CatalogCard
									href={`/courses/public/${course.id}`}
									eyebrow={course.curriculumTitle?.trim() ?? null}
									title={course.name}
									imageUrl={course.imageUrl}
									kindLabel="Self-paced"
									subtitle={course.description?.trim() || 'Self-paced public course'}
									progress={course.progress}
									priority={index === 0}
								/>
								{course.progress ? (
									<div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
										<div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em]">
											<span className="text-slate-500">Progress</span>
											<span className="text-slate-600">{progressPercent}%</span>
										</div>
										<div className="h-2 overflow-hidden rounded-full bg-slate-200">
											<div
												className={cn(
													'h-full rounded-full transition-all duration-300',
													course.progress.completed >= course.progress.total
														? 'bg-emerald-600'
														: 'bg-sky-600',
												)}
												style={{
													width: `${progressPercent}%`,
												}}
											/>
										</div>
									</div>
								) : null}
							</div>
						)
					})}
				</div>
			) : (
				<div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-sm text-slate-500">
					No public courses match that curriculum.
				</div>
			)}
		</section>
	)
}
