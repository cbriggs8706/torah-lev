'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
	Popover,
	PopoverTrigger,
	PopoverContent,
} from '@/components/ui/popover'
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
} from '@/components/ui/command'
import { Check, ChevronsUpDown } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'

export interface Lesson {
	id: number
	title: string
	courseId?: number
}

export interface Course {
	id: number
	title: string
}

export default function StudyGroupLessonSelector({
	studyGroup,
	selectedLessonIds,
	onLessonSelect,
}: {
	studyGroup: any
	selectedLessonIds: number[]

	onLessonSelect: (lesson: Lesson, checked: boolean) => void
}) {
	const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
	const [courses, setCourses] = useState<Course[]>([])
	const [lessons, setLessons] = useState<Lesson[]>([])
	const [loadingLessons, setLoadingLessons] = useState(false)
	const [openCourse, setOpenCourse] = useState(false)
	const [openLesson, setOpenLesson] = useState(false)

	// ✅ Load courses from Neon (via API)
	useEffect(() => {
		async function loadCourses() {
			try {
				const res = await fetch('/api/public/courses')
				if (!res.ok) throw new Error('Failed to fetch courses')
				const data = await res.json()
				setCourses(data)
			} catch (err) {
				console.error('Error loading courses:', err)
				setCourses([])
			}
		}
		loadCourses()
	}, [])

	// ✅ Load lessons for selected course
	useEffect(() => {
		if (!selectedCourse) return

		const courseId = selectedCourse.id
		setLoadingLessons(true)
		setLessons([])

		async function loadLessons() {
			try {
				const res = await fetch(`/api/public/courses/${courseId}/lessons`)
				if (!res.ok) throw new Error('Failed to fetch lessons')
				const data = await res.json()
				setLessons(data)
			} catch (err) {
				console.error('Error loading lessons:', err)
				setLessons([])
			} finally {
				setLoadingLessons(false)
			}
		}

		loadLessons()
	}, [selectedCourse])

	return (
		<div className="flex flex-col sm:flex-row items-center gap-4">
			{/* 🔹 Course combobox */}
			<Popover open={openCourse} onOpenChange={setOpenCourse}>
				<PopoverTrigger asChild>
					<Button
						variant="primaryOutline"
						role="combobox"
						className="w-[220px] justify-between"
						disabled={!courses.length}
					>
						{selectedCourse ? selectedCourse.title : 'Select Course'}
						<ChevronsUpDown className="opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent
					className="w-[240px] p-0 max-h-[250px] overflow-y-auto"
					align="start"
				>
					<Command>
						<CommandInput placeholder="Search courses..." />
						<CommandEmpty>No courses found.</CommandEmpty>
						<CommandGroup>
							{courses.map((course) => (
								<CommandItem
									key={course.id}
									onSelect={() => {
										setSelectedCourse(course)
										setOpenCourse(false)
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

			{/* 🔹 Lesson multi-select combobox */}
			<Popover open={openLesson} onOpenChange={setOpenLesson}>
				<PopoverTrigger asChild>
					<Button
						variant="primaryOutline"
						role="combobox"
						className="w-[220px] justify-between"
						disabled={!selectedCourse || loadingLessons}
					>
						{selectedLessonSummary(
							selectedLessonIds,
							lessons,
							loadingLessons,
							selectedCourse
						)}
						<ChevronsUpDown className="opacity-50" />
					</Button>
				</PopoverTrigger>

				{/* ✅ Fix: use `PopoverPortal` and `PopoverContent asChild` */}
				<PopoverContent
					align="start"
					sideOffset={4}
					className="w-[280px] p-0 border bg-white shadow-md max-h-[320px] overflow-hidden"
				>
					<div className="h-[320px] overflow-y-auto overscroll-contain">
						<Command>
							<CommandInput placeholder="Search lessons..." />
							<CommandEmpty>
								{loadingLessons ? 'Loading...' : 'No lessons found.'}
							</CommandEmpty>
							<CommandGroup>
								{lessons.map((lesson) => {
									const isChecked = selectedLessonIds.includes(lesson.id)
									return (
										<CommandItem
											key={lesson.id}
											onSelect={() =>
												onLessonSelect(
													{ id: lesson.id, title: lesson.title },
													!isChecked
												)
											}
										>
											<div className="flex items-center gap-2 w-full">
												<Checkbox checked={isChecked} />
												<span className="flex-1 truncate">{lesson.title}</span>
												{isChecked && (
													<Check className="w-4 h-4 text-green-600" />
												)}
											</div>
										</CommandItem>
									)
								})}
							</CommandGroup>
						</Command>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	)
}

function selectedLessonSummary(
	selectedLessonIds: number[],
	lessons: Lesson[],
	loading: boolean,
	course: Course | null
) {
	if (!course) return 'Select a course first'
	if (loading) return 'Loading lessons...'
	if (selectedLessonIds.length === 0) return 'Select Lessons'

	if (selectedLessonIds.length === 1) {
		const selected = lessons.find((l) => l.id === selectedLessonIds[0])
		return selected ? selected.title : '1 lesson selected'
	}

	return `${selectedLessonIds.length} lessons selected`
}
