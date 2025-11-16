// app/api/lessons/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { lessonFormSchema } from '@/forms/lessonSchemas'
import { updateLesson } from '@/db/queries/lessons'

export async function PATCH(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const body = await req.json()
		const data = lessonFormSchema.parse(body)

		await updateLesson(params.id, {
			lesson: {
				slug: data.slug,
				lessonNumber: data.lessonNumber,
				description: data.description ?? '',
				video: data.video ?? null,
				secondaryVideo: data.secondaryVideo ?? null,
				lessonScript: data.lessonScript ?? null,
				grammarLesson: data.grammarLesson ?? null,
				image: data.image ?? null,
			},
			vocabIds: data.vocabIds,
		})

		return new NextResponse(null, { status: 200 })
	} catch (err) {
		console.error(err)
		return new NextResponse('Invalid request', { status: 400 })
	}
}
