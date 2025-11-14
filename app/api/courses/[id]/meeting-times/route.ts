import { NextResponse } from 'next/server'
import {
	addMeetingTimes,
	replaceMeetingTimes,
	getMeetingTimes,
} from '@/db/queries/courses'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dayOfWeek } from '@/db/schema/enums'

type DayOfWeek = (typeof dayOfWeek.enumValues)[number]

const MeetingTimesSchema = z.array(
	z.object({
		day: z.enum(dayOfWeek.enumValues as [DayOfWeek, ...DayOfWeek[]]),
		startTime: z.string(),
		endTime: z.string().optional(),
		timezone: z.string().optional(),
	})
)

// GET meeting times
export async function GET(
	req: Request,
	{ params }: { params: { id: string } }
) {
	return NextResponse.json(await getMeetingTimes(params.id))
}

// POST add meeting times
export async function POST(
	req: Request,
	{ params }: { params: { id: string } }
) {
	const session = await getServerSession(authOptions)
	if (!session || session.user.role !== 'admin') {
		return new NextResponse('Unauthorized', { status: 401 })
	}

	const body = await req.json()
	const parsed = MeetingTimesSchema.safeParse(body)

	if (!parsed.success) {
		return NextResponse.json(parsed.error.format(), { status: 400 })
	}

	const withCourse = parsed.data.map((t) => ({
		...t,
		courseId: params.id,
	}))

	return NextResponse.json(await addMeetingTimes(params.id, withCourse))
}

// PUT replace
export async function PUT(
	req: Request,
	{ params }: { params: { id: string } }
) {
	const session = await getServerSession(authOptions)
	if (!session || session.user.role !== 'admin') {
		return new NextResponse('Unauthorized', { status: 401 })
	}

	const body = await req.json()
	const parsed = MeetingTimesSchema.safeParse(body)

	if (!parsed.success) {
		return NextResponse.json(parsed.error.format(), { status: 400 })
	}

	const withCourse = parsed.data.map((t) => ({
		...t,
		courseId: params.id,
	}))

	return NextResponse.json(await replaceMeetingTimes(params.id, withCourse))
}
