import { relations } from 'drizzle-orm'
import { user } from '@/db/schema/tables/auth'
import {
	mediaAssetLinks,
	mediaAssets,
	mediaAssetTags,
	mediaFolders,
	mediaTags,
} from '@/db/schema/tables/media_assets'

export const mediaAssetRelations = relations(mediaAssets, ({ many, one }) => ({
	folder: one(mediaFolders, {
		fields: [mediaAssets.folderId],
		references: [mediaFolders.id],
	}),
	links: many(mediaAssetLinks),
	tagLinks: many(mediaAssetTags),
	uploader: one(user, {
		fields: [mediaAssets.uploadedBy],
		references: [user.id],
	}),
}))

export const mediaFolderRelations = relations(mediaFolders, ({ many, one }) => ({
	parent: one(mediaFolders, {
		fields: [mediaFolders.parentId],
		references: [mediaFolders.id],
		relationName: 'media_folder_tree',
	}),
	children: many(mediaFolders, {
		relationName: 'media_folder_tree',
	}),
	assets: many(mediaAssets),
	creator: one(user, {
		fields: [mediaFolders.createdBy],
		references: [user.id],
	}),
}))

export const mediaTagRelations = relations(mediaTags, ({ many, one }) => ({
	assetLinks: many(mediaAssetTags),
	creator: one(user, {
		fields: [mediaTags.createdBy],
		references: [user.id],
	}),
}))

export const mediaAssetTagRelations = relations(mediaAssetTags, ({ one }) => ({
	asset: one(mediaAssets, {
		fields: [mediaAssetTags.assetId],
		references: [mediaAssets.id],
	}),
	tag: one(mediaTags, {
		fields: [mediaAssetTags.tagId],
		references: [mediaTags.id],
	}),
}))

export const mediaAssetLinkRelations = relations(
	mediaAssetLinks,
	({ one }) => ({
		asset: one(mediaAssets, {
			fields: [mediaAssetLinks.assetId],
			references: [mediaAssets.id],
		}),
		creator: one(user, {
			fields: [mediaAssetLinks.createdBy],
			references: [user.id],
		}),
	})
)
