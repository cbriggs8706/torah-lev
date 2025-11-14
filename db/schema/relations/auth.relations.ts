// src/db/schema/relations/auth.relations.ts
import { relations } from 'drizzle-orm'
import { account, session, user } from '../tables/auth'
import { gameResults } from '../tables/gameResults'
import { messages } from '../tables/messages'
import { courseEnrollments, courses } from '../tables/courses'

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account),
	gameResults: many(gameResults),
	messages: many(messages),
	organizedCourses: many(courses),
	enrollments: many(courseEnrollments), // <-- ADD THIS
}))

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id],
	}),
}))

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id],
	}),
}))
