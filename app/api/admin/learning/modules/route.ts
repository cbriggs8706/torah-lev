import { NextResponse } from 'next/server'
import { supabaseDb as db } from '@/db'
import { moduleSchema } from '@/forms/learningSchemas'
import { lessonModules, modules } from '@/db/schema/tables/modules'
import { requireAdminAccess } from '@/lib/admin/requireAdmin'

export async function GET() {
	const unauthorized = await requireAdminAccess()
	if (unauthorized) return unauthorized

	const rows = await db.query.modules.findMany({
		with: {
			mediaAsset: true,
			quiz: true,
			lessonAssignments: {
				with: {
					lesson: true,
				},
				orderBy: (lessonModules, { asc }) => [asc(lessonModules.sortOrder)],
			},
		},
		orderBy: (modules, { asc }) => [asc(modules.title)],
	})

	return NextResponse.json(rows)
}

export async function POST(req: Request) {
	const unauthorized = await requireAdminAccess()
	if (unauthorized) return unauthorized

	try {
		const parsed = moduleSchema.parse(await req.json())

		const created = await db.transaction(async (tx) => {
			const [module] = await tx
				.insert(modules)
				.values({
					title: parsed.title,
					type: parsed.type,
					mediaAssetId: parsed.mediaAssetId ?? null,
					externalUrl: parsed.externalUrl ?? null,
					quizId: parsed.quizId ?? null,
				})
				.returning()

			if (parsed.lessonIds?.length) {
				await tx.insert(lessonModules).values(
					parsed.lessonIds.map((lessonId, index) => ({
						lessonId,
						moduleId: module.id,
						sortOrder: index,
					}))
				)
			}

			return module
		})

		return NextResponse.json(created, { status: 201 })
	} catch (error) {
		console.error('Failed to create module', error)
		return NextResponse.json({ error: 'Failed to create module' }, { status: 400 })
	}
}
