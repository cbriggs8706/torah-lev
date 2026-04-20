import {
	bigint,
	boolean,
	foreignKey,
	index,
	integer,
	jsonb,
	primaryKey,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
	varchar,
} from 'drizzle-orm/pg-core'
import { mediaKind } from '../enums'
import { user } from './auth'

export const mediaAssets = pgTable(
	'media_assets',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		kind: mediaKind('kind').notNull(),
		folderId: uuid('folder_id'),
		bucket: text('bucket').notNull(),
		objectPath: text('object_path').notNull(),
		fileName: text('file_name').notNull(),
		originalFileName: text('original_file_name'),
		title: text('title'),
		altText: text('alt_text'),
		description: text('description'),
		mimeType: text('mime_type'),
		fileExtension: varchar('file_extension', { length: 20 }),
		sizeBytes: bigint('size_bytes', { mode: 'number' }),
		width: integer('width'),
		height: integer('height'),
		durationSeconds: integer('duration_seconds'),
		blurhash: text('blurhash'),
		isPublic: boolean('is_public').notNull().default(false),
		metadata: jsonb('metadata').notNull().default({}),
		uploadedBy: uuid('uploaded_by').references(() => user.id, {
			onDelete: 'set null',
		}),
		createdAt: timestamp('created_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.folderId],
			foreignColumns: [mediaFolders.id],
			name: 'media_assets_folder_id_media_folders_id_fk',
		}).onDelete('set null'),
		uniqueIndex('media_assets_object_path_unique').on(table.bucket, table.objectPath),
		index('media_assets_kind_idx').on(table.kind),
		index('media_assets_folder_idx').on(table.folderId),
		index('media_assets_uploaded_by_idx').on(table.uploadedBy),
		index('media_assets_created_at_idx').on(table.createdAt),
	]
)

export const mediaFolders = pgTable(
	'media_folders',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		name: text('name').notNull(),
		slug: text('slug').notNull(),
		parentId: uuid('parent_id'),
		createdBy: uuid('created_by').references(() => user.id, {
			onDelete: 'set null',
		}),
		createdAt: timestamp('created_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: 'media_folders_parent_id_media_folders_id_fk',
		}).onDelete('set null'),
		index('media_folders_parent_idx').on(table.parentId),
		uniqueIndex('media_folders_parent_slug_unique').on(table.parentId, table.slug),
	]
)

export const mediaTags = pgTable(
	'media_tags',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		name: text('name').notNull(),
		slug: text('slug').notNull().unique(),
		createdBy: uuid('created_by').references(() => user.id, {
			onDelete: 'set null',
		}),
		createdAt: timestamp('created_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [index('media_tags_name_idx').on(table.name)]
)

export const mediaAssetTags = pgTable(
	'media_asset_tags',
	{
		assetId: uuid('asset_id')
			.notNull()
			.references(() => mediaAssets.id, { onDelete: 'cascade' }),
		tagId: uuid('tag_id')
			.notNull()
			.references(() => mediaTags.id, { onDelete: 'cascade' }),
		taggedAt: timestamp('tagged_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		primaryKey({ columns: [table.assetId, table.tagId] }),
		index('media_asset_tags_tag_idx').on(table.tagId),
	]
)

export const mediaAssetLinks = pgTable(
	'media_asset_links',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		assetId: uuid('asset_id')
			.notNull()
			.references(() => mediaAssets.id, { onDelete: 'cascade' }),
		entityType: text('entity_type').notNull(),
		entityId: uuid('entity_id').notNull(),
		usage: text('usage').notNull().default('default'),
		locale: varchar('locale', { length: 10 }),
		sortOrder: integer('sort_order').notNull().default(0),
		notes: text('notes'),
		createdBy: uuid('created_by').references(() => user.id, {
			onDelete: 'set null',
		}),
		createdAt: timestamp('created_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		entityLookupIdx: index('media_asset_links_entity_lookup_idx').on(
			table.entityType,
			table.entityId,
			table.usage,
			table.sortOrder
		),
		assetIdx: index('media_asset_links_asset_idx').on(table.assetId),
		linkUnique: uniqueIndex('media_asset_links_unique_usage').on(
			table.assetId,
			table.entityType,
			table.entityId,
			table.usage,
			table.locale
		),
	})
)
