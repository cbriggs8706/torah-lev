import { asc, desc, eq, inArray } from 'drizzle-orm'
import { supabaseDb as db } from '@/db'
import { user } from '@/db/schema/tables/auth'
import {
	mediaAssets,
	mediaAssetTags,
	mediaFolders,
	mediaTags,
} from '@/db/schema/tables/media_assets'
import { getPublicMediaUrl } from './storage'
import { slugifyMediaLabel } from './utils'

export type MediaLibraryAsset = typeof mediaAssets.$inferSelect & {
	publicUrl: string
	folderName: string | null
	folderPathLabel: string | null
	tags: Array<{ id: string; name: string; slug: string }>
	uploaderName: string | null
}

export type MediaLibraryFolder = typeof mediaFolders.$inferSelect & {
	pathLabel: string
	depth: number
	assetCount: number
}

export async function getMediaLibraryData() {
	const [assetRows, folderRows, tagRows, assetTagRows] = await Promise.all([
		db
			.select({
				id: mediaAssets.id,
				kind: mediaAssets.kind,
				folderId: mediaAssets.folderId,
				bucket: mediaAssets.bucket,
				objectPath: mediaAssets.objectPath,
				fileName: mediaAssets.fileName,
				originalFileName: mediaAssets.originalFileName,
				title: mediaAssets.title,
				altText: mediaAssets.altText,
				description: mediaAssets.description,
				mimeType: mediaAssets.mimeType,
				fileExtension: mediaAssets.fileExtension,
				sizeBytes: mediaAssets.sizeBytes,
				width: mediaAssets.width,
				height: mediaAssets.height,
				durationSeconds: mediaAssets.durationSeconds,
				blurhash: mediaAssets.blurhash,
				isPublic: mediaAssets.isPublic,
				metadata: mediaAssets.metadata,
				uploadedBy: mediaAssets.uploadedBy,
				createdAt: mediaAssets.createdAt,
				updatedAt: mediaAssets.updatedAt,
				uploaderName: user.name,
			})
			.from(mediaAssets)
			.leftJoin(user, eq(mediaAssets.uploadedBy, user.id))
			.orderBy(desc(mediaAssets.createdAt)),
		db.select().from(mediaFolders).orderBy(asc(mediaFolders.name)),
		db.select().from(mediaTags).orderBy(asc(mediaTags.name)),
		db
			.select({
				assetId: mediaAssetTags.assetId,
				tagId: mediaTags.id,
				tagName: mediaTags.name,
				tagSlug: mediaTags.slug,
			})
			.from(mediaAssetTags)
			.innerJoin(mediaTags, eq(mediaAssetTags.tagId, mediaTags.id)),
	])

	const folderMap = new Map(folderRows.map((folder) => [folder.id, folder]))
	const assetTagsMap = new Map<string, Array<{ id: string; name: string; slug: string }>>()

	for (const row of assetTagRows) {
		const tags = assetTagsMap.get(row.assetId) ?? []
		tags.push({ id: row.tagId, name: row.tagName, slug: row.tagSlug })
		assetTagsMap.set(row.assetId, tags)
	}

	const folderPathCache = new Map<string, { pathLabel: string; depth: number }>()

	function getFolderPathMeta(folderId: string | null) {
		if (!folderId) return null
		if (folderPathCache.has(folderId)) {
			return folderPathCache.get(folderId)!
		}

		const segments: string[] = []
		let depth = 0
		let currentId: string | null = folderId
		const seen = new Set<string>()

		while (currentId) {
			if (seen.has(currentId)) break
			seen.add(currentId)
			const folder = folderMap.get(currentId)
			if (!folder) break
			segments.unshift(folder.name)
			depth += 1
			currentId = folder.parentId
		}

		const meta = {
			pathLabel: segments.join(' / '),
			depth: Math.max(0, depth - 1),
		}
		folderPathCache.set(folderId, meta)
		return meta
	}

	const folderAssetCounts = new Map<string, number>()
	for (const asset of assetRows) {
		if (asset.folderId) {
			folderAssetCounts.set(
				asset.folderId,
				(folderAssetCounts.get(asset.folderId) ?? 0) + 1
			)
		}
	}

	const folders: MediaLibraryFolder[] = folderRows
		.map((folder) => {
			const meta = getFolderPathMeta(folder.id)
			return {
				...folder,
				pathLabel: meta?.pathLabel ?? folder.name,
				depth: meta?.depth ?? 0,
				assetCount: folderAssetCounts.get(folder.id) ?? 0,
			}
		})
		.sort((a, b) => a.pathLabel.localeCompare(b.pathLabel))

	const assets: MediaLibraryAsset[] = assetRows.map((asset) => {
		const folderMeta = getFolderPathMeta(asset.folderId)
		return {
			...asset,
			publicUrl: getPublicMediaUrl(asset.bucket, asset.objectPath),
			folderName: asset.folderId ? folderMap.get(asset.folderId)?.name ?? null : null,
			folderPathLabel: folderMeta?.pathLabel ?? null,
			tags: assetTagsMap.get(asset.id) ?? [],
			uploaderName: asset.uploaderName ?? null,
		}
	})

	return {
		assets,
		folders,
		tags: tagRows,
	}
}

export async function getFolderPathSegments(folderId: string | null) {
	if (!folderId) return []

	const segments: string[] = []
	let currentId: string | null = folderId
	const seen = new Set<string>()

	while (currentId) {
		if (seen.has(currentId)) break
		seen.add(currentId)
		const [folder] = await db
			.select()
			.from(mediaFolders)
			.where(eq(mediaFolders.id, currentId))
			.limit(1)
		if (!folder) break
		segments.unshift(folder.slug)
		currentId = folder.parentId
	}

	return segments
}

export async function ensureMediaTags(
	tx: any,
	inputNames: string[],
	userId: string
) {
	const names = [...new Set(inputNames.map((name) => name.trim()).filter(Boolean))]
	if (names.length === 0) return []

	const slugs = names.map((name) => slugifyMediaLabel(name))
	const existing = await tx
		.select()
		.from(mediaTags)
		.where(inArray(mediaTags.slug, slugs))
	const existingBySlug = new Map(
		existing.map((tag: { slug: string }) => [tag.slug, tag])
	)

	const missing = names.filter((name) => {
		const slug = slugifyMediaLabel(name)
		return slug && !existingBySlug.has(slug)
	})

	if (missing.length > 0) {
		await tx.insert(mediaTags).values(
			missing.map((name) => ({
				name,
				slug: slugifyMediaLabel(name),
				createdBy: userId,
			}))
		)
	}

	return tx.select().from(mediaTags).where(inArray(mediaTags.slug, slugs))
}

export async function replaceAssetTags(
	tx: any,
	assetId: string,
	tagIds: string[]
) {
	await tx.delete(mediaAssetTags).where(eq(mediaAssetTags.assetId, assetId))

	if (tagIds.length === 0) return

	await tx.insert(mediaAssetTags).values(
		tagIds.map((tagId) => ({
			assetId,
			tagId,
		}))
	)
}

export async function getMediaAssetRecord(assetId: string) {
	const [asset] = await db
		.select()
		.from(mediaAssets)
		.where(eq(mediaAssets.id, assetId))
		.limit(1)

	return asset ?? null
}

export async function deleteAssetTagLinks(assetId: string) {
	return db.delete(mediaAssetTags).where(eq(mediaAssetTags.assetId, assetId))
}

export async function folderExists(folderId: string) {
	const [folder] = await db
		.select({ id: mediaFolders.id })
		.from(mediaFolders)
		.where(eq(mediaFolders.id, folderId))
		.limit(1)
	return Boolean(folder)
}

export async function validateParentFolder(parentId: string | null) {
	if (!parentId) return true
	return folderExists(parentId)
}
