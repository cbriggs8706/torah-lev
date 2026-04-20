export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseDb as db } from '@/db'
import { mediaAssets } from '@/db/schema/tables/media_assets'
import {
	ensureMediaTags,
	getMediaAssetRecord,
	replaceAssetTags,
} from '@/lib/media/library'
import { deleteMediaObject } from '@/lib/media/storage'

function isMediaAdmin(role?: string | null) {
	return Boolean(role && ['admin', 'teacher'].includes(role))
}

export async function PATCH(
	req: Request,
	context: { params: Promise<{ id: string }> }
) {
	const session = await getServerSession(authOptions)
	if (!session?.user?.id || !isMediaAdmin(session.user.role)) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const { id } = await context.params

	try {
		const body = (await req.json()) as {
			title?: string | null
			description?: string | null
			altText?: string | null
			folderId?: string | null
			tags?: string[]
		}

		const updated = await db.transaction(async (tx) => {
			const [asset] = await tx
				.update(mediaAssets)
				.set({
					title: body.title?.trim() || null,
					description: body.description?.trim() || null,
					altText: body.altText?.trim() || null,
					folderId: body.folderId?.trim() || null,
					updatedAt: new Date(),
				})
				.where(eq(mediaAssets.id, id))
				.returning()

			if (!asset) {
				throw new Error('Asset not found')
			}

			const tags = await ensureMediaTags(
				tx,
				body.tags ?? [],
				session.user.id
			)
			await replaceAssetTags(
				tx,
				asset.id,
				tags.map((tag: { id: string }) => tag.id)
			)

			return asset
		})

		return NextResponse.json({ asset: updated })
	} catch (error) {
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : 'Failed to update media' },
			{ status: 500 }
		)
	}
}

export async function DELETE(
	_req: Request,
	context: { params: Promise<{ id: string }> }
) {
	const session = await getServerSession(authOptions)
	if (!session?.user?.id || !isMediaAdmin(session.user.role)) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const { id } = await context.params
	const asset = await getMediaAssetRecord(id)
	if (!asset) {
		return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
	}

	try {
		await deleteMediaObject(asset.bucket, asset.objectPath)
		await db.delete(mediaAssets).where(eq(mediaAssets.id, id))
		return NextResponse.json({ ok: true })
	} catch (error) {
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : 'Failed to delete media' },
			{ status: 500 }
		)
	}
}
