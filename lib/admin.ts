import { getSession, getUserId } from '@/lib/auth'

const legacyAdminIds = ['user_2kaRJOK3LURBbcyO1pusrktbcqx']

function parseCsv(value?: string) {
	return (value ?? '')
		.split(',')
		.map((part) => part.trim())
		.filter(Boolean)
}

export const isAdmin = async () => {
	const userId = await getUserId()

	if (!userId || userId.startsWith('guest')) {
		return false
	}

	// Keep local development unblocked for signed-in users.
	if (process.env.NODE_ENV !== 'production') {
		return true
	}

	const session = await getSession()
	const email = session?.user?.email?.toLowerCase() ?? ''

	const adminIds = new Set([
		...legacyAdminIds,
		...parseCsv(process.env.ADMIN_USER_IDS),
	])
	const adminEmails = new Set(
		parseCsv(process.env.ADMIN_EMAILS).map((value) => value.toLowerCase())
	)

	return adminIds.has(userId) || (!!email && adminEmails.has(email))
}
