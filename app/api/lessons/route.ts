// app/api/lessons/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { lessonFormSchema } from '@/forms/lessonSchemas'
import { createLesson } from '@/db/queries/lessons'

export async function POST(req: NextRequest) {
	try {
		const body = await req.json()
		const data = lessonFormSchema.parse(body)

		const created = await createLesson({
			lesson: {
				slug: data.slug,
				lessonNumber: data.lessonNumber,
				description: data.description ?? '',
				unitId: data.unitId,
				video: data.video ?? null,
				secondaryVideo: data.secondaryVideo ?? null,
				lessonScript: data.lessonScript ?? null,
				grammarLesson: data.grammarLesson ?? null,
				image: data.image ?? null,
			},
		})

		return NextResponse.json(created)
	} catch (err) {
		console.error(err)
		return new NextResponse('Invalid request', { status: 400 })
	}
}
