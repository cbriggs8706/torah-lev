export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseDb as db } from '@/db'
import { mediaAssets } from '@/db/schema/tables/media_assets'
import {
	ensureMediaTags,
	getFolderPathSegments,
	replaceAssetTags,
} from '@/lib/media/library'
import { uploadMediaObject } from '@/lib/media/storage'
import { inferMediaKind, type MediaKind } from '@/lib/media/utils'

function isMediaAdmin(role?: string | null) {
	return Boolean(role && ['admin', 'teacher'].includes(role))
}

export async function GET() {
	const session = await getServerSession(authOptions)
	if (!session?.user?.id || !isMediaAdmin(session.user.role)) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const { getMediaLibraryData } = await import('@/lib/media/library')
	const data = await getMediaLibraryData()
	return NextResponse.json(data)
}

export async function POST(req: Request) {
	const session = await getServerSession(authOptions)
	if (!session?.user?.id || !isMediaAdmin(session.user.role)) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	try {
		const formData = await req.formData()
		const file = formData.get('file')
		if (!(file instanceof File)) {
			return NextResponse.json({ error: 'Missing file' }, { status: 400 })
		}

		const title = String(formData.get('title') ?? '').trim() || null
		const description = String(formData.get('description') ?? '').trim() || null
		const altText = String(formData.get('altText') ?? '').trim() || null
		const folderId = String(formData.get('folderId') ?? '').trim() || null
		const requestedKind = String(formData.get('kind') ?? '').trim()
		const tagsInput = String(formData.get('tags') ?? '').trim()
		const metadataInput = String(formData.get('metadata') ?? '').trim()
		const metadata =
			metadataInput.length > 0 ? JSON.parse(metadataInput) : {}

		const kind =
			requestedKind && requestedKind !== 'auto'
				? (requestedKind as MediaKind)
				: inferMediaKind(file.type || 'application/octet-stream', file.name)

		const folderSegments = await getFolderPathSegments(folderId)
		const arrayBuffer = await file.arrayBuffer()
		const uploaded = await uploadMediaObject({
			kind,
			fileName: file.name,
			contentType: file.type || 'application/octet-stream',
			buffer: Buffer.from(arrayBuffer),
			folderPath: folderSegments.join('/'),
		})

		const created = await db.transaction(async (tx) => {
			const [asset] = await tx
				.insert(mediaAssets)
				.values({
					kind,
					folderId,
					bucket: uploaded.bucket,
					objectPath: uploaded.objectPath,
					fileName: file.name,
					originalFileName: file.name,
					title,
					description,
					altText,
					mimeType: file.type || 'application/octet-stream',
					fileExtension: file.name.includes('.')
						? file.name.split('.').pop()?.toLowerCase() ?? null
						: null,
					sizeBytes: file.size,
					isPublic: true,
					metadata,
					uploadedBy: session.user.id,
				})
				.returning()

			const tagNames = tagsInput
				.split(',')
				.map((tag) => tag.trim())
				.filter(Boolean)
			const tags = await ensureMediaTags(tx, tagNames, session.user.id)
			await replaceAssetTags(
				tx,
				asset.id,
				tags.map((tag: { id: string }) => tag.id)
			)

			return asset
		})

		return NextResponse.json({
			asset: created,
			publicUrl: uploaded.url,
		})
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : 'Failed to upload media',
			},
			{ status: 500 }
		)
	}
}
