import {
	pgTable,
	uuid,
	varchar,
	text,
	timestamp,
	boolean,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const users = pgTable('users', {
	id: uuid('id').defaultRandom().primaryKey(), // Works with NextAuth UUID
	username: varchar('username', { length: 100 }).notNull().unique(),
	email: varchar('email', { length: 255 }).notNull().unique(),
	passwordHash: text('password_hash').notNull(), // Hashed password for Credentials provider
	image: text('image'),
	role: varchar('role', { length: 50 }).default('user').notNull(), // 'user', 'teacher', 'admin'
	activeCourseId: uuid('active_course_id'), // optional
	isEmailVerified: boolean('is_email_verified').default(false).notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Relations can connect to user progress, tribes, etc. later
export const usersRelations = relations(users, ({ many }) => ({
	// Example placeholder for future relations:
	// progress: many(userProgress),
}))
