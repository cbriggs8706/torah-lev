import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { supabaseDb as db } from '@/db'
import { lessons } from '@/db/schema/tables/lessons'
import { lessonModules } from '@/db/schema/tables/modules'
import { lessonSchema } from '@/forms/learningSchemas'
import { requireAdminAccess } from '@/lib/admin/requireAdmin'

export async function PATCH(
	req: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const unauthorized = await requireAdminAccess()
	if (unauthorized) return unauthorized

	try {
		const { id } = await params
		const parsed = lessonSchema.parse(await req.json())
		const updated = await db.transaction(async (tx) => {
			const [lesson] = await tx
				.update(lessons)
				.set({
					title: parsed.title,
					number: parsed.number,
					part: parsed.part,
					organizationId: parsed.organizationId ?? null,
					targetLanguageId: parsed.targetLanguageId,
					updatedAt: new Date(),
				})
				.where(eq(lessons.id, id))
				.returning()

			if (!lesson) return null

			await tx.delete(lessonModules).where(eq(lessonModules.lessonId, id))

			if (parsed.moduleIds.length) {
				await tx.insert(lessonModules).values(
					parsed.moduleIds.map((moduleId, index) => ({
						lessonId: id,
						moduleId,
						sortOrder: index,
					}))
				)
			}

			return lesson
		})

		if (!updated) {
			return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
		}

		return NextResponse.json(updated)
	} catch (error) {
		console.error('Failed to update lesson', error)
		return NextResponse.json(
			{ error: 'Failed to update lesson' },
			{ status: 400 }
		)
	}
}

export async function DELETE(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const unauthorized = await requireAdminAccess()
	if (unauthorized) return unauthorized

	const { id } = await params
	const [deleted] = await db
		.delete(lessons)
		.where(eq(lessons.id, id))
		.returning({ id: lessons.id })

	if (!deleted) {
		return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
	}

	return NextResponse.json({ success: true })
}
