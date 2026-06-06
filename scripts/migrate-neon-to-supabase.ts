import 'dotenv/config'
import { mkdtemp, readFile, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { spawn } from 'child_process'

import { getDatabaseConfig, getDatabaseUrl } from '../db/connection'

async function readRawEnvValue(name: string) {
	try {
		const envFile = await readFile('.env', 'utf8')
		const line = envFile
			.split('\n')
			.find((entry) => entry.startsWith(`${name}=`))

		return line?.slice(name.length + 1).trim() || null
	} catch {
		return null
	}
}

function run(command: string, args: string[], env: NodeJS.ProcessEnv) {
	return new Promise<void>((resolve, reject) => {
		const child = spawn(command, args, {
			stdio: 'inherit',
			env,
		})

		child.on('error', reject)
		child.on('exit', (code) => {
			if (code === 0) {
				resolve()
				return
			}

			reject(new Error(`${command} exited with code ${code}`))
		})
	})
}

async function resetPublicSchema(target: {
	host?: string
	port?: number
	user?: string
	password?: string
	database?: string
}) {
	await run(
		'psql',
		[
			'--host',
			target.host!,
			'--port',
			String(target.port!),
			'--username',
			target.user!,
			'--dbname',
			target.database!,
			'--command',
			[
				'DROP SCHEMA IF EXISTS public CASCADE;',
				'CREATE SCHEMA public;',
				'GRANT ALL ON SCHEMA public TO postgres;',
				'GRANT ALL ON SCHEMA public TO public;',
			].join(' '),
		],
		{
			...process.env,
			PGPASSWORD: target.password,
			PGSSLMODE: 'require',
		},
	)
}

async function main() {
	const sourceUrl =
		process.env.NEON_DATABASE_URL?.trim() || getDatabaseUrl('DATABASE_URL')
	let target

	try {
		target = getDatabaseConfig('SUPABASE_DB_URL')
	} catch {
		const rawTargetUrl = await readRawEnvValue('SUPABASE_DB_URL')
		if (!rawTargetUrl) {
			throw new Error('SUPABASE_DB_URL is invalid')
		}

		process.env.SUPABASE_DB_URL = rawTargetUrl
		target = getDatabaseConfig('SUPABASE_DB_URL')
	}

	if (sourceUrl === target.connectionString) {
		throw new Error('Source and target database URLs are identical')
	}

	const tempDir = await mkdtemp(join(tmpdir(), 'torah-lev-db-migration-'))
	const dumpFile = join(tempDir, 'neon.dump')

	try {
		console.log('Dumping Neon database...')
		await run(
			'pg_dump',
			[
				'--format=custom',
				'--no-owner',
				'--no-privileges',
				'--schema=public',
				'--file',
				dumpFile,
				sourceUrl,
			],
			process.env,
		)

		console.log('Replacing Supabase public schema...')
		await resetPublicSchema(target)

		console.log('Restoring dump into Supabase...')
		await run(
			'pg_restore',
			[
				'--no-owner',
				'--no-privileges',
				'--schema=public',
				'--host',
				target.host!,
				'--port',
				String(target.port!),
				'--username',
				target.user!,
				'--dbname',
				target.database!,
				dumpFile,
			],
			{
				...process.env,
				PGPASSWORD: target.password,
				PGSSLMODE: 'require',
			},
		)

		console.log('Supabase migration complete.')
	} finally {
		await rm(tempDir, { recursive: true, force: true })
	}
}

main().catch((error) => {
	console.error(error)
	process.exit(1)
})
