import { NextResponse } from 'next/server'
import { asc } from 'drizzle-orm'
import { supabaseDb as db } from '@/db'
import { organizations } from '@/db/schema/tables/organizations'
import { organizationSchema } from '@/forms/learningSchemas'
import { requireAdminAccess } from '@/lib/admin/requireAdmin'

export async function GET() {
	const unauthorized = await requireAdminAccess()
	if (unauthorized) return unauthorized

	const rows = await db.query.organizations.findMany({
		orderBy: (organizations, { asc }) => [asc(organizations.title)],
	})

	return NextResponse.json(rows)
}

export async function POST(req: Request) {
	const unauthorized = await requireAdminAccess()
	if (unauthorized) return unauthorized

	try {
		const parsed = organizationSchema.parse(await req.json())
		const [created] = await db
			.insert(organizations)
			.values({
				title: parsed.title,
			})
			.returning()

		return NextResponse.json(created, { status: 201 })
	} catch (error) {
		console.error('Failed to create organization', error)
		return NextResponse.json(
			{ error: 'Failed to create organization' },
			{ status: 400 }
		)
	}
}
