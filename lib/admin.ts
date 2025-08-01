import { auth } from '@clerk/nextjs/server'

const adminIds = ['user_2kaRJOK3LURBbcyO1pusrktbcqx']

export const isAdmin = () => {
	const { userId } = auth()

	if (!userId) {
		return false
	}

	return adminIds.indexOf(userId) !== -1
}
