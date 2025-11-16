// db/queries/courses.ts

import { supabaseDb as db } from '@/db/client'
import {
	courses,
	courseMeetingTimes,
	courseEnrollments,
} from '@/db/schema/tables/courses'

import { eq, and } from 'drizzle-orm'
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'

// =======================
// Types
// =======================

export type Course = InferSelectModel<typeof courses>
export type CourseWithRelations = Awaited<
	ReturnType<typeof db.query.courses.findMany>
>[number]

export type InsertCourse = InferInsertModel<typeof courses>

export type MeetingTime = InferSelectModel<typeof courseMeetingTimes>
export type InsertMeetingTime = InferInsertModel<typeof courseMeetingTimes>

export type Enrollment = InferSelectModel<typeof courseEnrollments>
export type InsertEnrollment = InferInsertModel<typeof courseEnrollments>

// A course with its enrollments relation loaded
export type CourseWithEnrollments = Course & {
	enrolledCount: number
	isEnrolled: boolean

	enrollments: (Enrollment & {
		student: {
			id: string
			name: string | null
			email: string | null
			image: string | null
			username?: string | null
		}
	})[]
}

// A course plus a computed count
export type CourseWithCount = Course & {
	enrolledCount: number
	isEnrolled: boolean
	organizer?: {
		id: string
		name: string | null
		email: string | null
		image: string | null
	}
}
// =======================
// COURSE QUERIES
// =======================

export async function createCourse(data: InsertCourse) {
	const [created] = await db.insert(courses).values(data).returning()
	return created
}

export async function updateCourse(
	courseId: string,
	data: Partial<InsertCourse>
) {
	const [updated] = await db
		.update(courses)
		.set(data)
		.where(eq(courses.id, courseId))
		.returning()

	return updated
}

export async function deleteCourse(courseId: string) {
	const [deleted] = await db
		.delete(courses)
		.where(eq(courses.id, courseId))
		.returning()

	return deleted
}

export async function getCourse(courseId: string) {
	return db.query.courses.findFirst({
		where: eq(courses.id, courseId),
		with: {
			organizer: true,
			meetingTimes: true,
			enrollments: {
				with: {
					student: true,
				},
			},
		},
	})
}

export async function getCourseById(id: string) {
	return db
		.select()
		.from(courses)
		.where(eq(courses.id, id))
		.limit(1)
		.then((res) => res[0] ?? null)
}

export async function getCourseByCode(courseCode: string) {
	return db
		.select()
		.from(courses)
		.where(eq(courses.courseCode, courseCode))
		.limit(1)
		.then((res) => res[0] ?? null)
}

export async function getCourseBySlug(slug: string) {
	return db.query.courses.findFirst({
		where: eq(courses.slug, slug),
		with: {
			organizer: true,
			meetingTimes: true,
			enrollments: {
				with: {
					student: true,
				},
			},
		},
	})
}

export async function getCourseByCodeWithRelations(courseCode: string) {
	return await db.query.courses.findFirst({
		where: eq(courses.courseCode, courseCode),
		with: {
			units: {
				with: {
					lessons: true,
				},
			},
		},
	})
}

export async function getPublicCourses() {
	return db.query.courses.findMany({
		where: eq(courses.public, true),
		with: {
			meetingTimes: true,
			organizer: true,
		},
		orderBy: (courses, { desc }) => [desc(courses.createdAt)],
	})
}

export async function getAllCourses() {
	return db.query.courses.findMany({
		with: {
			meetingTimes: true,
			organizer: true,
		},
		orderBy: (courses, { desc }) => [desc(courses.createdAt)],
	})
}

export async function getAllPublicCoursesWithEnrollment(
	userId: string | undefined
): Promise<CourseWithCount[]> {
	const rows = (await db.query.courses.findMany({
		where: eq(courses.public, true),
		with: {
			enrollments: true,
			organizer: true,
		},
		orderBy: (c, { asc }) => [asc(c.startDate)],
	})) as CourseWithEnrollments[]

	return rows.map((course) => ({
		...course,
		enrolledCount: course.enrollments.length,
		isEnrolled: userId
			? course.enrollments.some((e) => e.studentId === userId)
			: false,
	}))
}

export async function getCurrentPublicCourses(): Promise<CourseWithCount[]> {
	const rows = (await db.query.courses.findMany({
		where: and(eq(courses.public, true), eq(courses.current, true)),
		with: {
			enrollments: true,
			organizer: true,
		},
		orderBy: (c, { asc }) => [asc(c.startDate)],
	})) as CourseWithEnrollments[]

	return rows.map((course) => ({
		...course,
		enrolledCount: course.enrollments.length,
		isEnrolled: false,
	}))
}

export async function getEnrolledCoursesForUser(
	userId: string
): Promise<CourseWithCount[]> {
	const enrollments = await db.query.courseEnrollments.findMany({
		where: eq(courseEnrollments.studentId, userId),
		with: {
			course: {
				with: {
					enrollments: true,
					organizer: true,
				},
			},
		},
	})

	return enrollments.map((e) => {
		// explicitly cast so TypeScript knows it includes `enrollments`
		const course = e.course as CourseWithEnrollments

		return {
			...course,
			enrolledCount: course.enrollments.length,
			isEnrolled: true,
		}
	})
}

export async function getCoursesByOrganizer(organizerId: string) {
	const rows = (await db.query.courses.findMany({
		where: eq(courses.organizerId, organizerId),
		with: {
			enrollments: {
				with: { student: true },
			},
		},
		orderBy: (c, { asc }) => [asc(c.startDate)],
	})) as CourseWithEnrollments[]

	return rows.map((course) => ({
		...course,
		enrolledCount: course.enrollments.filter((e) => e.role === 'student')
			.length,
	}))
}

// =======================
// MEETING TIMES
// =======================

export async function addMeetingTimes(
	courseId: string,
	times: InsertMeetingTime | InsertMeetingTime[]
) {
	const values = Array.isArray(times)
		? times.map((t) => ({ ...t, courseId }))
		: [{ ...times, courseId }]

	return db.insert(courseMeetingTimes).values(values).returning()
}

export async function replaceMeetingTimes(
	courseId: string,
	times: InsertMeetingTime[]
) {
	await db
		.delete(courseMeetingTimes)
		.where(eq(courseMeetingTimes.courseId, courseId))

	return addMeetingTimes(courseId, times)
}

export async function deleteMeetingTimes(courseId: string) {
	return db
		.delete(courseMeetingTimes)
		.where(eq(courseMeetingTimes.courseId, courseId))
		.returning()
}

export async function getMeetingTimes(courseId: string) {
	return db.query.courseMeetingTimes.findMany({
		where: eq(courseMeetingTimes.courseId, courseId),
	})
}

// =======================
// ENROLLMENT QUERIES
// =======================

export async function enrollStudent(courseId: string, studentId: string) {
	const [row] = await db
		.insert(courseEnrollments)
		.values({ courseId, studentId })
		.onConflictDoNothing()
		.returning()

	return row ?? { alreadyEnrolled: true }
}

export async function unenrollStudent(courseId: string, studentId: string) {
	return db
		.delete(courseEnrollments)
		.where(
			and(
				eq(courseEnrollments.courseId, courseId),
				eq(courseEnrollments.studentId, studentId)
			)
		)
		.returning()
}

export async function getCourseStudents(courseId: string) {
	return db.query.courseEnrollments.findMany({
		where: eq(courseEnrollments.courseId, courseId),
		with: {
			student: true,
		},
	})
}

export async function getStudentCourses(studentId: string) {
	return db.query.courseEnrollments.findMany({
		where: eq(courseEnrollments.studentId, studentId),
		with: {
			course: {
				with: {
					meetingTimes: true,
				},
			},
		},
	})
}
