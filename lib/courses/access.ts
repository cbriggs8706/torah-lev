import { and, eq } from 'drizzle-orm'
import { supabaseDb } from '@/db/client'
import { courses, courseEnrollments } from '@/db/schema/tables/courses'
import { courseMemberships } from '@/db/schema/tables/course_collaboration'

export const COURSE_MANAGER_ROLES = new Set(['organizer', 'teacher', 'ta'])

export type CourseMembershipRole = 'organizer' | 'teacher' | 'ta' | 'student'

export type CourseAccessSnapshot = {
	courseId: string
	courseCode: string
	isPublic: boolean
	isOrganizer: boolean
	isEnrolled: boolean
	isMember: boolean
	membershipRole: CourseMembershipRole | null
}

export function canManageCourse(
	access: CourseAccessSnapshot | null,
	sessionRole?: string
) {
	if (!access) return false
	if (sessionRole === 'admin') return true
	if (access.isOrganizer) return true
	return access.membershipRole ? COURSE_MANAGER_ROLES.has(access.membershipRole) : false
}

export function canAccessPrivateCourse(
	access: CourseAccessSnapshot | null,
	sessionRole?: string
) {
	if (!access) return false
	if (access.isPublic) return true
	if (sessionRole === 'admin') return true
	if (access.isOrganizer || access.isMember || access.isEnrolled) return true
	return false
}

export async function getCourseAccessById(
	courseId: string,
	userId?: string
): Promise<CourseAccessSnapshot | null> {
	const course = await supabaseDb.query.courses.findFirst({
		where: eq(courses.id, courseId),
		columns: {
			id: true,
			courseCode: true,
			public: true,
			organizerId: true,
		},
	})
	if (!course) return null

	if (!userId) {
		return {
			courseId: course.id,
			courseCode: course.courseCode,
			isPublic: course.public,
			isOrganizer: false,
			isMember: false,
			isEnrolled: false,
			membershipRole: null,
		}
	}

	const [membership, enrollment] = await Promise.all([
		supabaseDb.query.courseMemberships.findFirst({
			where: and(
				eq(courseMemberships.courseId, course.id),
				eq(courseMemberships.userId, userId)
			),
			columns: { role: true },
		}),
		supabaseDb.query.courseEnrollments.findFirst({
			where: and(
				eq(courseEnrollments.courseId, course.id),
				eq(courseEnrollments.studentId, userId)
			),
			columns: { studentId: true },
		}),
	])

	return {
		courseId: course.id,
		courseCode: course.courseCode,
		isPublic: course.public,
		isOrganizer: course.organizerId === userId,
		isMember: !!membership,
		isEnrolled: !!enrollment,
		membershipRole: (membership?.role as CourseMembershipRole | undefined) ?? null,
	}
}

export async function getCourseAccessByCode(
	courseCode: string,
	userId?: string
): Promise<CourseAccessSnapshot | null> {
	const course = await supabaseDb.query.courses.findFirst({
		where: eq(courses.courseCode, courseCode),
		columns: {
			id: true,
			courseCode: true,
			public: true,
			organizerId: true,
		},
	})
	if (!course) return null

	return getCourseAccessById(course.id, userId)
}
