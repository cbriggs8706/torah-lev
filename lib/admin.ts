import { eq } from 'drizzle-orm'
import db from '@/db/drizzle'
import { users } from '@/db/schema'
import { getUserId } from '@/lib/auth'
import { hasRole } from '@/lib/roles'

export const isAdmin = async () => {
	const userId = await getUserId()

	if (!userId || userId.startsWith('guest')) {
		return false
	}

	const userRecord = await db.query.users.findFirst({
		where: eq(users.id, userId),
		columns: {
			roles: true,
		},
	})

	if (hasRole(userRecord?.roles, 'admin')) {
		return true
	}

	return false
}
