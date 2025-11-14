import { NextResponse } from 'next/server'
import { getPublicCourses, createCourse } from '@/db/queries/courses'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { courseType, proficiencyLevel } from '@/db/schema/enums'
type CourseType = (typeof courseType.enumValues)[number]

// ==============================
// Schema for validation
// ==============================
const CreateCourseSchema = z.object({
	slug: z.string(),
	courseCode: z.string(),
	section: z.string().optional(),
	type: z.enum(courseType.enumValues as [CourseType, ...CourseType[]]),
	description: z.string().optional(),
	imageSrc: z.string(),
	category: z.string().optional(),
	startProficiencyLevel: z.enum(proficiencyLevel.enumValues),
	endProficiencyLevel: z.enum(proficiencyLevel.enumValues),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
	organizerId: z.string().optional(),
	organizerGroupName: z.string().optional(),
	location: z.string().optional(),
	zoomLink: z.string().optional(),
	maxEnrollment: z.number().optional(),
	enrollmentOpen: z.boolean().optional(),
})

// ==============================
// GET /api/courses
// ==============================
export async function GET() {
	const courses = await getPublicCourses()
	return NextResponse.json(courses)
}

// ==============================
// POST /api/courses (ADMIN ONLY)
// ==============================
export async function POST(req: Request) {
	const session = await getServerSession(authOptions)

	if (!session || !session.user) {
		return new NextResponse('Unauthorized', { status: 401 })
	}

	const body = await req.json()
	const parsed = CreateCourseSchema.safeParse(body)

	if (!parsed.success) {
		return NextResponse.json(parsed.error.format(), { status: 400 })
	}

	const userId = session.user.id // <—— 💥 organizer ID from session

	const data = parsed.data

	const created = await createCourse({
		...data,

		organizerId: userId, // <—— ALWAYS set here

		startDate: data.startDate ? new Date(data.startDate) : null,
		endDate: data.endDate ? new Date(data.endDate) : null,
	})

	return NextResponse.json(created, { status: 201 })
}
