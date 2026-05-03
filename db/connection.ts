type DatabaseConfig = {
	connectionString: string
	host?: string
	port?: number
	user?: string
	password?: string
	database?: string
}

const runtimeDatabaseFallbackEnvVars = [
	'DIRECT_DATABASE_URL',
	'POSTGRES_URL_NON_POOLING',
	'SUPABASE_DIRECT_URL',
]

function parsePossiblyRawConnectionString(value: string): DatabaseConfig {
	try {
		const url = new URL(value)
		return {
			connectionString: value,
			host: url.hostname,
			port: url.port ? Number(url.port) : 5432,
			user: decodeURIComponent(url.username),
			password: decodeURIComponent(url.password),
			database: url.pathname.replace(/^\//, ''),
		}
	} catch {
		const schemeIndex = value.indexOf('://')
		const atIndex = value.lastIndexOf('@')
		const slashIndex = value.indexOf('/', atIndex)

		if (schemeIndex === -1 || atIndex === -1 || slashIndex === -1) {
			throw new Error('Database URL is invalid')
		}

		const authPart = value.slice(schemeIndex + 3, atIndex)
		const hostPart = value.slice(atIndex + 1, slashIndex)
		const databasePartWithSuffix = value.slice(slashIndex + 1)
		const database = databasePartWithSuffix.split(/[?#]/, 1)[0]
		const suffix = databasePartWithSuffix.slice(database.length)
		const authSeparator = authPart.indexOf(':')
		const portSeparator = hostPart.lastIndexOf(':')

		if (
			authSeparator === -1 ||
			portSeparator === -1 ||
			!database.length
		) {
			throw new Error('Database URL is invalid')
		}

		const user = authPart.slice(0, authSeparator)
		const password = authPart.slice(authSeparator + 1)
		const host = hostPart.slice(0, portSeparator)
		const port = hostPart.slice(portSeparator + 1)

		const safeUrl = `postgresql://${encodeURIComponent(
			user
		)}:${encodeURIComponent(password)}@${host}:${port}/${database}${suffix}`

		return {
			connectionString: safeUrl,
			host,
			port: Number(port),
			user,
			password,
			database,
		}
	}
}

function resolveDatabaseEnvValue(envVar: string) {
	const envVars =
		envVar === 'DATABASE_URL'
			? [...runtimeDatabaseFallbackEnvVars, envVar]
			: [envVar]

	for (const candidate of envVars) {
		const value = process.env[candidate]?.trim()

		if (value) {
			return value
		}
	}

	return null
}

export function getDatabaseConfig(envVar = 'DATABASE_URL') {
	const value = resolveDatabaseEnvValue(envVar)

	if (!value) {
		throw new Error(`${envVar} is not set`)
	}

	return parsePossiblyRawConnectionString(value)
}

export function getDatabaseUrl(envVar = 'DATABASE_URL') {
	return getDatabaseConfig(envVar).connectionString
}
