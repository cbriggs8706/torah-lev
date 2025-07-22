import { auth } from '@clerk/nextjs'

export const hebrewFriendIds = [
	'user_2kaRJOK3LURBbcyO1pusrktbcqx',
	'user_2llR99WBfib72dO24XNG4GDsOUH',
	'user_2loFe9hgT2U4UwOKbdOdDR2RBTE',
	'user_2zFMOGZXlqTIlYyMMwc5tUK0086',
	'user_2zFN6tHWDAtAnujYVaMuRoM5rjH',
	'user_2zbdmugBHPC2QK9XZODpkiKBd2U',
	// my hdm user
	// 'user_2zhVPti1l3FhMvMXS4pSm5tw4PP',
]
export const spanishFriendIds = ['user_2zhVPti1l3FhMvMXS4pSm5tw4PP']

export const englishFriendIds = ['user_2zhVPti1l3FhMvMXS4pSm5tw4PP']

export const isHebrewFriend = () => {
	const { userId } = auth()

	if (!userId) {
		return false
	}

	return hebrewFriendIds.indexOf(userId) !== -1
}
export const isSpanishFriend = () => {
	const { userId } = auth()

	if (!userId) {
		return false
	}

	return spanishFriendIds.indexOf(userId) !== -1
}
export const isEnglishFriend = () => {
	const { userId } = auth()

	if (!userId) {
		return false
	}

	return englishFriendIds.indexOf(userId) !== -1
}
