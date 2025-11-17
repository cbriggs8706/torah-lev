// components/courses/CurrentPublicCoursesList.tsx
'use client'

import { useState } from 'react'
import { CourseCard } from './CourseCard'
import { CourseWithCount } from '@/db/queries/courses'
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from '@/components/ui/select'

const TYPE_LABELS: Record<string, string> = {
	INPERSON: 'In-Person Courses',
	VIRTUAL: 'Virtual Courses',
	HYBRID: 'Hybrid Courses',
	SELFPACED: 'Self-Paced Courses',
}

// Proper natural sort with numeric awareness
function naturalCourseSort(a: CourseWithCount, b: CourseWithCount) {
	return a.courseCode.localeCompare(b.courseCode, undefined, { numeric: true })
}

export function CurrentPublicCoursesList({
	courses,
}: {
	courses: CourseWithCount[]
}) {
	const [languageFilter, setLanguageFilter] = useState<string>('ALL')

	// Get unique languages for dropdown
	const languages = Array.from(new Set(courses.map((c) => c.language))).sort()

	// Apply filter if language is chosen
	const filteredCourses =
		languageFilter === 'ALL'
			? courses
			: courses.filter((c) => c.language === languageFilter)

	if (!filteredCourses.length) {
		return <p className="text-muted-foreground">No public courses available.</p>
	}

	// Group by type
	const groupedByType = filteredCourses.reduce((acc, course) => {
		if (!acc[course.type]) acc[course.type] = []
		acc[course.type].push(course)
		return acc
	}, {} as Record<string, CourseWithCount[]>)

	// Sort each type group
	for (const type in groupedByType) {
		groupedByType[type].sort(naturalCourseSort)
	}

	return (
		<div className="space-y-10">
			{/* Language Filter */}
			<div className="flex justify-end mb-4">
				<Select value={languageFilter} onValueChange={setLanguageFilter}>
					<SelectTrigger className="w-[200px]">
						<SelectValue placeholder="Filter by language" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="ALL">All Languages</SelectItem>
						{languages.map((lang) => (
							<SelectItem key={lang} value={lang}>
								{lang}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Course Sections */}
			{Object.entries(groupedByType).map(([type, typeCourses]) => (
				<div key={type}>
					<h2 className="text-2xl font-bold mb-4">
						{TYPE_LABELS[type] ?? type}
					</h2>

					{/* Self-paced has no organizer groups */}
					{type === 'SELFPACED' ? (
						<div className="grid gap-4 grid-cols-1 md:grid-cols-3">
							{typeCourses.map((course) => (
								<CourseCard key={course.id} course={course} />
							))}
						</div>
					) : (
						<GroupedByOrganizer courses={typeCourses} />
					)}
				</div>
			))}
		</div>
	)
}

function GroupedByOrganizer({ courses }: { courses: CourseWithCount[] }) {
	// organizerGroupName → array of courses
	const grouped = courses.reduce((acc, course) => {
		const group = course.organizerGroupName ?? 'Other'
		if (!acc[group]) acc[group] = []
		acc[group].push(course)
		return acc
	}, {} as Record<string, CourseWithCount[]>)

	return (
		<div className="space-y-6">
			{Object.entries(grouped).map(([groupName, groupCourses]) => (
				<div key={groupName}>
					<h3 className="text-xl font-semibold mb-2">{groupName}</h3>

					<div className="grid gap-4 grid-cols-1 md:grid-cols-3">
						{groupCourses.sort(naturalCourseSort).map((course) => (
							<CourseCard key={course.id} course={course} />
						))}
					</div>
				</div>
			))}
		</div>
	)
}
