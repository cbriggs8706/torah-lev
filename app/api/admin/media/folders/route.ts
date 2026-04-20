export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseDb as db } from '@/db'
import { mediaFolders } from '@/db/schema/tables/media_assets'
import { slugifyMediaLabel } from '@/lib/media/utils'

function isMediaAdmin(role?: string | null) {
	return Boolean(role && ['admin', 'teacher'].includes(role))
}

export async function POST(req: Request) {
	const session = await getServerSession(authOptions)
	if (!session?.user?.id || !isMediaAdmin(session.user.role)) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	try {
		const body = (await req.json()) as {
			name?: string
			parentId?: string | null
		}
		const name = body.name?.trim() ?? ''
		if (!name) {
			return NextResponse.json({ error: 'Folder name is required' }, { status: 400 })
		}

		const [folder] = await db
			.insert(mediaFolders)
			.values({
				name,
				slug: slugifyMediaLabel(name),
				parentId: body.parentId?.trim() || null,
				createdBy: session.user.id,
			})
			.returning()

		return NextResponse.json({ folder })
	} catch (error) {
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : 'Failed to create folder' },
			{ status: 500 }
		)
	}
}
