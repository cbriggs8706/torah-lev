import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { supabaseDb as db } from '@/db'
import { organizations } from '@/db/schema/tables/organizations'
import { organizationSchema } from '@/forms/learningSchemas'
import { requireAdminAccess } from '@/lib/admin/requireAdmin'

export async function PATCH(
	req: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const unauthorized = await requireAdminAccess()
	if (unauthorized) return unauthorized

	try {
		const { id } = await params
		const parsed = organizationSchema.parse(await req.json())
		const [updated] = await db
			.update(organizations)
			.set({
				title: parsed.title,
				updatedAt: new Date(),
			})
			.where(eq(organizations.id, id))
			.returning()

		if (!updated) {
			return NextResponse.json(
				{ error: 'Organization not found' },
				{ status: 404 }
			)
		}

		return NextResponse.json(updated)
	} catch (error) {
		console.error('Failed to update organization', error)
		return NextResponse.json(
			{ error: 'Failed to update organization' },
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
		.delete(organizations)
		.where(eq(organizations.id, id))
		.returning({ id: organizations.id })

	if (!deleted) {
		return NextResponse.json(
			{ error: 'Organization not found' },
			{ status: 404 }
		)
	}

	return NextResponse.json({ success: true })
}
