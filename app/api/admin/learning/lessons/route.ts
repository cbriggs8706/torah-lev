import { NextResponse } from 'next/server'
import { supabaseDb as db } from '@/db'
import { lessons } from '@/db/schema/tables/lessons'
import { lessonModules } from '@/db/schema/tables/modules'
import { lessonSchema } from '@/forms/learningSchemas'
import { requireAdminAccess } from '@/lib/admin/requireAdmin'

export async function GET() {
	const unauthorized = await requireAdminAccess()
	if (unauthorized) return unauthorized

	const rows = await db.query.lessons.findMany({
		orderBy: (lessons, { asc }) => [
			asc(lessons.sortOrder),
			asc(lessons.number),
			asc(lessons.title),
		],
	})

	return NextResponse.json(rows)
}

export async function POST(req: Request) {
	const unauthorized = await requireAdminAccess()
	if (unauthorized) return unauthorized

	try {
		const parsed = lessonSchema.parse(await req.json())
		const created = await db.transaction(async (tx) => {
			const [lesson] = await tx
				.insert(lessons)
				.values({
					title: parsed.title,
					number: parsed.number,
					part: parsed.part,
					sortOrder: parsed.sortOrder,
					courseId: parsed.courseId ?? null,
					organizationId: parsed.organizationId ?? null,
					targetLanguageId: parsed.targetLanguageId,
				})
				.returning()

			if (parsed.moduleIds.length) {
				await tx.insert(lessonModules).values(
					parsed.moduleIds.map((moduleId, index) => ({
						lessonId: lesson.id,
						moduleId,
						sortOrder: index,
					}))
				)
			}

			return lesson
		})

		return NextResponse.json(created, { status: 201 })
	} catch (error) {
		console.error('Failed to create lesson', error)
		return NextResponse.json(
			{ error: 'Failed to create lesson' },
			{ status: 400 }
		)
	}
}
