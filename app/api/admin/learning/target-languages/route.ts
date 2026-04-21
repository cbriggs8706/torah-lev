import { NextResponse } from 'next/server'
import { supabaseDb as db } from '@/db'
import { targetLanguages } from '@/db/schema/tables/target_languages'
import { targetLanguageSchema } from '@/forms/learningSchemas'
import { requireAdminAccess } from '@/lib/admin/requireAdmin'

export async function GET() {
	const unauthorized = await requireAdminAccess()
	if (unauthorized) return unauthorized

	const rows = await db.query.targetLanguages.findMany({
		orderBy: (targetLanguages, { asc }) => [asc(targetLanguages.name)],
	})

	return NextResponse.json(rows)
}

export async function POST(req: Request) {
	const unauthorized = await requireAdminAccess()
	if (unauthorized) return unauthorized

	try {
		const parsed = targetLanguageSchema.parse(await req.json())
		const [created] = await db
			.insert(targetLanguages)
			.values({
				name: parsed.name,
			})
			.returning()

		return NextResponse.json(created, { status: 201 })
	} catch (error) {
		console.error('Failed to create target language', error)
		return NextResponse.json(
			{ error: 'Failed to create target language' },
			{ status: 400 }
		)
	}
}
