import { relations } from 'drizzle-orm'
import { messages } from '../tables/messages'
import { courses } from '../tables/courses'
import { user } from '../tables/auth'

export const messagesRelations = relations(messages, ({ one }) => ({
	course: one(courses, {
		fields: [messages.studyGroupId], // or courseId if you rename it
		references: [courses.id],
	}),
	sender: one(user, {
		fields: [messages.senderId],
		references: [user.id],
	}),
}))
