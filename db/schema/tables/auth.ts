// db/schema/tables/auth.ts
import {
	pgTable,
	uuid,
	text,
	varchar,
	integer,
	timestamp,
	primaryKey,
} from 'drizzle-orm/pg-core'

// --- User table ---
export const user = pgTable('user', {
	id: uuid('id').defaultRandom().primaryKey(), // ✅ keep UUID everywhere
	name: varchar('name', { length: 255 }),
	email: varchar('email', { length: 255 }).notNull().unique(),
	emailVerified: timestamp('emailVerified', { withTimezone: true }),
	image: text('image'),

	username: varchar('username', { length: 100 }),
	passwordHash: text('password_hash'),
	role: varchar('role', { length: 50 }).default('user').notNull(),
})

// --- Account table ---
export const account = pgTable(
	'account',
	{
		userId: uuid('userId')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }), // ✅ must reference user.id
		type: varchar('type', { length: 255 }).notNull(),
		provider: varchar('provider', { length: 255 }).notNull(),
		providerAccountId: varchar('providerAccountId', { length: 255 }).notNull(),
		refresh_token: text('refresh_token'),
		access_token: text('access_token'),
		expires_at: integer('expires_at'),
		token_type: varchar('token_type', { length: 255 }),
		scope: text('scope'),
		id_token: text('id_token'),
		session_state: text('session_state'),
	},
	(table) => ({
		compoundKey: primaryKey({
			columns: [table.provider, table.providerAccountId],
		}),
	})
)

// --- Session table ---
export const session = pgTable('session', {
	sessionToken: text('sessionToken').primaryKey(),
	userId: uuid('userId')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	expires: timestamp('expires', { withTimezone: true }).notNull(),
})

// --- Verification Token ---
export const verificationToken = pgTable(
	'verificationToken',
	{
		identifier: varchar('identifier', { length: 255 }).notNull(),
		token: text('token').notNull(),
		expires: timestamp('expires', { withTimezone: true }).notNull(),
	},
	(table) => ({
		compositePK: primaryKey({ columns: [table.identifier, table.token] }),
	})
)
