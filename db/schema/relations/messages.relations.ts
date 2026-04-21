import { relations } from 'drizzle-orm'
import { messages } from '../tables/messages'
import { user } from '../tables/auth'

export const messagesRelations = relations(messages, ({ one }) => ({
	sender: one(user, {
		fields: [messages.senderId],
		references: [user.id],
	}),
}))
