import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { supabaseDb as db } from '@/db'
import { moduleSchema } from '@/forms/learningSchemas'
import { lessonModules, modules } from '@/db/schema/tables/modules'
import { requireAdminAccess } from '@/lib/admin/requireAdmin'

export async function PATCH(
	req: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const unauthorized = await requireAdminAccess()
	if (unauthorized) return unauthorized

	try {
		const { id } = await params
		const parsed = moduleSchema.parse(await req.json())

		const updated = await db.transaction(async (tx) => {
			const [module] = await tx
				.update(modules)
				.set({
					title: parsed.title,
					type: parsed.type,
					mediaAssetId: parsed.mediaAssetId ?? null,
					externalUrl: parsed.externalUrl ?? null,
					quizId: parsed.quizId ?? null,
					updatedAt: new Date(),
				})
				.where(eq(modules.id, id))
				.returning()

			if (!module) return null

			if (parsed.lessonIds) {
				await tx.delete(lessonModules).where(eq(lessonModules.moduleId, id))

				if (parsed.lessonIds.length) {
					await tx.insert(lessonModules).values(
						parsed.lessonIds.map((lessonId, index) => ({
							lessonId,
							moduleId: id,
							sortOrder: index,
						}))
					)
				}
			}

			return module
		})

		if (!updated) {
			return NextResponse.json({ error: 'Module not found' }, { status: 404 })
		}

		return NextResponse.json(updated)
	} catch (error) {
		console.error('Failed to update module', error)
		return NextResponse.json({ error: 'Failed to update module' }, { status: 400 })
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
		.delete(modules)
		.where(eq(modules.id, id))
		.returning({ id: modules.id })

	if (!deleted) {
		return NextResponse.json({ error: 'Module not found' }, { status: 404 })
	}

	return NextResponse.json({ success: true })
}
