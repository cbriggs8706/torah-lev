import { auth } from '@clerk/nextjs/server'

export const hebrewFriendIds = [
	'user_2kaRJOK3LURBbcyO1pusrktbcqx', //cbriggs8706
	'user_2llR99WBfib72dO24XNG4GDsOUH', //sassytunafish
	'user_2loFe9hgT2U4UwOKbdOdDR2RBTE', //leahonarose
	'user_2zFMOGZXlqTIlYyMMwc5tUK0086', //gwardh
	'user_2zFN6tHWDAtAnujYVaMuRoM5rjH', //hebrewforme
	'user_2zbdmugBHPC2QK9XZODpkiKBd2U', //mossmanhill
	'user_301Ac0xi4Bx1NhZ0Qy9YicdTXaI', //apulley
	'user_2zY9uZIuR37LCLw2ziHVpqoo6gd', //flora
	'user_2zFMLmH8IGm8VLv5VVA4jsI5eTb', //frobonni
	'user_2rk2UFic8kTZU5jkWe4jl588Kmb', //tebernie1
	// 'user_2zhVPti1l3FhMvMXS4pSm5tw4PP', //cbriggs hdm user
]
export const spanishFriendIds = [
	'user_2zhVPti1l3FhMvMXS4pSm5tw4PP', //cbriggs hdm user
	'user_2rk2UFic8kTZU5jkWe4jl588Kmb', //tebernie1
	'user_2zFN6tHWDAtAnujYVaMuRoM5rjH', //hebrewforme
]

export const englishFriendIds = [
	'user_2zhVPti1l3FhMvMXS4pSm5tw4PP', //cbriggs hdm user
	'user_2rk2UFic8kTZU5jkWe4jl588Kmb', //tebernie1
]

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
