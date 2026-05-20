'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
} from '@/components/ui/command'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Lesson {
	id: number
	title: string
	order?: number
	lessonNumber?: string | number
	unitId?: number
	unitTitle?: string
	unitOrder?: number
}

export interface Course {
	id: number
	title: string
	description?: string
	imageSrc?: string
}

export default function CourseLessonSelector({
	studyGroup,
	onLessonSelect,
}: {
	studyGroup: any
	onLessonSelect: (lesson: Lesson) => void
}) {
	const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
	const [lessons, setLessons] = useState<Lesson[]>([])
	const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
	const [loadingLessons, setLoadingLessons] = useState(false)
	const [openCourse, setOpenCourse] = useState(false)
	const [openLesson, setOpenLesson] = useState(false)

	const courses: Course[] =
		studyGroup?.availableCourses || studyGroup?.courses || []

	// 🔹 Fetch lessons when a course is selected
	useEffect(() => {
		if (!selectedCourse) return
		setLoadingLessons(true)
		setLessons([])

		fetch(`/api/courses/${selectedCourse.id}/lessons`)
			.then((res) => res.json())
			.then((data: Lesson[]) => setLessons(data))
			.finally(() => setLoadingLessons(false))
	}, [selectedCourse])

	return (
		<div className="flex flex-col sm:flex-row items-center gap-4">
			{/* 🔹 Course combobox */}
			<Popover open={openCourse} onOpenChange={setOpenCourse}>
				<PopoverTrigger asChild>
					<Button
						variant="primary"
						role="combobox"
						className="w-[220px] justify-between"
						disabled={!courses.length}
					>
						{selectedCourse ? selectedCourse.title : 'Select Course'}
						<ChevronsUpDown className="opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent
					className="w-[240px] p-0 max-h-[250px] overflow-y-auto" // ✅ scrollable
					align="start"
				>
					<Command>
						<CommandInput placeholder="Search course..." />
						<CommandEmpty>No courses found.</CommandEmpty>
						<CommandGroup>
							{courses.map((course) => (
								<CommandItem
									key={course.id}
									onSelect={() => {
										setSelectedCourse(course)
										setSelectedLesson(null)
										setOpenCourse(false) // ✅ close popover
									}}
								>
									{course.title}
									{selectedCourse?.id === course.id && (
										<Check className="ml-auto h-4 w-4" />
									)}
								</CommandItem>
							))}
						</CommandGroup>
					</Command>
				</PopoverContent>
			</Popover>

			{/* 🔹 Lesson combobox */}
			<Popover open={openLesson} onOpenChange={setOpenLesson}>
				<PopoverTrigger asChild>
					<Button
						variant="primary"
						role="combobox"
						className="w-[220px] justify-between"
						disabled={!selectedCourse || loadingLessons}
					>
						{selectedLesson
							? selectedLesson.title
							: selectedCourse
							? loadingLessons
								? 'Loading lessons...'
								: 'Select Lesson'
							: 'Select a course first'}
						<ChevronsUpDown className="opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent
					className="w-[240px] p-0 max-h-[250px] overflow-y-auto" // ✅ scrollable
					align="start"
				>
					<Command>
						<CommandInput placeholder="Search lesson..." />
						<CommandEmpty>
							{loadingLessons
								? 'Loading...'
								: 'No lessons found for this course'}
						</CommandEmpty>
						<CommandGroup>
							{lessons.map((lesson) => (
								<CommandItem
									key={lesson.id}
									onSelect={() => {
										setSelectedLesson(lesson)
										onLessonSelect(lesson)
										setOpenLesson(false) // ✅ close popover
									}}
								>
									{[
										lesson.unitOrder ? `Unit ${lesson.unitOrder}` : null,
										lesson.unitTitle ?? null,
										lesson.lessonNumber
											? `Lesson ${lesson.lessonNumber}`
											: null,
										lesson.title,
									]
										.filter(Boolean)
										.join(' - ')}
									{selectedLesson?.id === lesson.id && (
										<Check className="ml-auto h-4 w-4" />
									)}
								</CommandItem>
							))}
						</CommandGroup>
					</Command>
				</PopoverContent>
			</Popover>
		</div>
	)
}
