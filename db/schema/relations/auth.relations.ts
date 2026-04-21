// src/db/schema/relations/auth.relations.ts
import { relations } from 'drizzle-orm'
import { account, session, user } from '../tables/auth'
import { gameResults } from '../tables/gameResults'
import { messages } from '../tables/messages'

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account),
	gameResults: many(gameResults),
	messages: many(messages),
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
