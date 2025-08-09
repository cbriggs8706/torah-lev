import { auth } from '@clerk/nextjs/server'

const adminIds = ['user_2kaRJOK3LURBbcyO1pusrktbcqx']

export const isAdmin = async () => {
	const { userId } = await auth() // Ensure that auth() is awaited

	if (!userId) {
		return false
	}

	return adminIds.indexOf(userId) !== -1
}
