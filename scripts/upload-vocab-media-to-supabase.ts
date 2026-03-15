import 'dotenv/config'

import { createClient } from '@supabase/supabase-js'
import { promises as fs } from 'node:fs'
import path from 'node:path'

import awbHebrewVocab from '@/lib/data/vocab/awbVocab.json'
import abcHebrewVocab from '@/lib/data/vocab/abcVocab.json'
import awaGreekVocab from '@/lib/data/vocab/awaVocab.json'
import ec1EnglishVocab from '@/lib/data/vocab/ec1Vocab.json'
import ec2EnglishVocab from '@/lib/data/vocab/ec2Vocab.json'
import efwEnglishVocab from '@/lib/data/vocab/efwVocab.json'
import ewbEnglishVocab from '@/lib/data/vocab/ewbVocab.json'
import hsHebrewVocab from '@/lib/data/vocab/hsVocab.json'
import lrEnglishVocab from '@/lib/data/vocab/lrVocab.json'
import type { EnglishVocab, GreekVocab, HebrewVocab } from '@/lib/vocab'
import { normalizeVocabStoragePath } from '@/lib/vocab-media'

type AnyVocab = EnglishVocab | GreekVocab | HebrewVocab

const projectRoot = process.cwd()
const publicRoot = path.join(projectRoot, 'public')
const bucketName =
	process.env.NEXT_PUBLIC_SUPABASE_VOCAB_BUCKET?.trim() || 'vocab-media'
const batchSize = 20

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
	throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
}

if (!serviceRoleKey) {
	throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

function normalizeStoragePath(value?: string | null) {
	if (!value) return null

	const trimmed = value.trim()
	if (!trimmed || /^https?:\/\//i.test(trimmed)) return null

	return trimmed.replace(/^\/+/, '')
}

function collectReferencedPaths(items: AnyVocab[]) {
	const refs = new Set<string>()

	for (const item of items) {
		for (const image of item.images ?? []) {
			const normalized = normalizeStoragePath(image)
			if (normalized) refs.add(normalized)
		}

		if ('hebAudio' in item) {
			const normalized = normalizeStoragePath(item.hebAudio)
			if (normalized) refs.add(normalized)
		}

		if ('engAudio' in item) {
			const normalized = normalizeStoragePath(item.engAudio)
			if (normalized) refs.add(normalized)
		}

		if ('grkAudio' in item) {
			const normalized = normalizeStoragePath(item.grkAudio)
			if (normalized) refs.add(normalized)
		}
	}

	return [...refs].sort()
}

async function ensureBucket() {
	const { data: buckets, error: listError } = await supabase.storage.listBuckets()
	if (listError) throw listError

	const existing = buckets.find((bucket) => bucket.name === bucketName)
	if (existing) return

	const { error: createError } = await supabase.storage.createBucket(bucketName, {
		public: true,
	})

	if (createError && !/already exists/i.test(createError.message)) {
		throw createError
	}
}

async function fileExists(absolutePath: string) {
	try {
		await fs.access(absolutePath)
		return true
	} catch {
		return false
	}
}

async function uploadPath(localRefPath: string) {
	const localPath = path.join(publicRoot, localRefPath)
	const storagePath = normalizeVocabStoragePath(localRefPath)
	const file = await fs.readFile(localPath)

	const { error } = await supabase.storage.from(bucketName).upload(storagePath, file, {
		upsert: true,
		contentType: undefined,
	})

	if (error) {
		throw new Error(`${storagePath}: ${error.message}`)
	}
}

async function runInBatches(pathsToUpload: string[]) {
	for (let index = 0; index < pathsToUpload.length; index += batchSize) {
		const batch = pathsToUpload.slice(index, index + batchSize)
		await Promise.all(batch.map((localRefPath) => uploadPath(localRefPath)))
		console.log(
			`Uploaded ${Math.min(index + batch.length, pathsToUpload.length)}/${pathsToUpload.length}`
		)
	}
}

async function main() {
	const allVocab: AnyVocab[] = [
		...(awbHebrewVocab as HebrewVocab[]),
		...(hsHebrewVocab as HebrewVocab[]),
		...(abcHebrewVocab as HebrewVocab[]),
		...(awaGreekVocab as GreekVocab[]),
		...(efwEnglishVocab as EnglishVocab[]),
		...(ewbEnglishVocab as EnglishVocab[]),
		...(lrEnglishVocab as EnglishVocab[]),
		...(ec1EnglishVocab as EnglishVocab[]),
		...(ec2EnglishVocab as EnglishVocab[]),
	]

	const referencedPaths = collectReferencedPaths(allVocab)
	const existingPaths: string[] = []
	const missingPaths: string[] = []

	for (const storagePath of referencedPaths) {
		const absolutePath = path.join(publicRoot, storagePath)
		if (await fileExists(absolutePath)) {
			existingPaths.push(storagePath)
		} else {
			missingPaths.push(storagePath)
		}
	}

	await ensureBucket()
	await runInBatches(existingPaths)

	console.log(
		JSON.stringify(
			{
				bucketName,
				referencedCount: referencedPaths.length,
				uploadedCount: existingPaths.length,
				missingCount: missingPaths.length,
				missingPaths,
			},
			null,
			2
		)
	)
}

main().catch((error) => {
	console.error('Failed to upload vocab media to Supabase.')
	console.error(error)
	process.exit(1)
})
