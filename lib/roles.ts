export type UserRole = 'user' | 'admin' | 'leader'

export function normalizeRoles(roles: string[] | null | undefined) {
	const unique = new Set<string>()

	for (const role of roles ?? []) {
		const trimmed = role.trim()
		if (trimmed) {
			unique.add(trimmed)
		}
	}

	if (!unique.size) {
		unique.add('user')
	}

	return Array.from(unique)
}

export function hasRole(
	roles: string[] | null | undefined,
	role: UserRole
) {
	return normalizeRoles(roles).includes(role)
}
