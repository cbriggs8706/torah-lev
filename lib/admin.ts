import { getUserId } from '@/lib/auth'

// TODO update with nextauth userId from clerk userID
const adminIds = ['user_2kaRJOK3LURBbcyO1pusrktbcqx']

export const isAdmin = async () => {
	const userId = await getUserId()

	if (!userId) {
		return false
	}

	return adminIds.indexOf(userId) !== -1
}
