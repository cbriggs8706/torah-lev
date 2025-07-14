import { auth } from '@clerk/nextjs'

export const friendIds = [
	'user_2kaRJOK3LURBbcyO1pusrktbcqx',
	'user_2llR99WBfib72dO24XNG4GDsOUH',
	'user_2loFe9hgT2U4UwOKbdOdDR2RBTE',
	'user_2zFMOGZXlqTIlYyMMwc5tUK0086',
	'user_2zFN6tHWDAtAnujYVaMuRoM5rjH',
	'user_2zbdmugBHPC2QK9XZODpkiKBd2U',
	'user_2zhVPti1l3FhMvMXS4pSm5tw4PP',
]

export const isFriend = () => {
	const { userId } = auth()

	if (!userId) {
		return false
	}

	return friendIds.indexOf(userId) !== -1
}
