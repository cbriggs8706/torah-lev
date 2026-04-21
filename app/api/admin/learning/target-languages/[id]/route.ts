import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { supabaseDb as db } from '@/db'
import { targetLanguages } from '@/db/schema/tables/target_languages'
import { targetLanguageSchema } from '@/forms/learningSchemas'
import { requireAdminAccess } from '@/lib/admin/requireAdmin'

export async function PATCH(
	req: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const unauthorized = await requireAdminAccess()
	if (unauthorized) return unauthorized

	try {
		const { id } = await params
		const parsed = targetLanguageSchema.parse(await req.json())
		const [updated] = await db
			.update(targetLanguages)
			.set({
				name: parsed.name,
				updatedAt: new Date(),
			})
			.where(eq(targetLanguages.id, id))
			.returning()

		if (!updated) {
			return NextResponse.json(
				{ error: 'Target language not found' },
				{ status: 404 }
			)
		}

		return NextResponse.json(updated)
	} catch (error) {
		console.error('Failed to update target language', error)
		return NextResponse.json(
			{ error: 'Failed to update target language' },
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
		.delete(targetLanguages)
		.where(eq(targetLanguages.id, id))
		.returning({ id: targetLanguages.id })

	if (!deleted) {
		return NextResponse.json(
			{ error: 'Target language not found' },
			{ status: 404 }
		)
	}

	return NextResponse.json({ success: true })
}
