import fs from 'fs'
import path from 'path'
import Image from 'next/image'
import { getSession } from '@/lib/auth'
import { FeedWrapper } from '@/components/feed-wrapper'
import HebrewVerbList from '@/components/hebrew/hebrew-verb-list'
import allVerbs from '@/lib/data/hebrew/verbs/index.json'

function getAvailableVerbRoutes() {
	const verbsRoot = path.join(process.cwd(), 'lib', 'data', 'hebrew', 'verbs')
	const entries = fs.readdirSync(verbsRoot, { withFileTypes: true })
	const routeMap: Record<string, string[]> = {}

	for (const entry of entries) {
		if (!entry.isDirectory()) continue

		const binyan = entry.name
		const binyanDir = path.join(verbsRoot, binyan)
		const files = fs.readdirSync(binyanDir).filter((file) => file.endsWith('.json'))
		const strongsSet = new Set<number>()

		for (const file of files) {
			const filePath = path.join(binyanDir, file)
			const data = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Array<{
				strongs?: number
			}>

			for (const entry of data) {
				if (typeof entry.strongs !== 'number') continue
				strongsSet.add(entry.strongs)
			}
		}

		for (const strongs of strongsSet) {
			const key = String(strongs)
			routeMap[key] ??= []
			routeMap[key].push(binyan)
		}
	}

	return routeMap
}

export default async function HebrewVerbsPage() {
	const session = await getSession()
	const userId = session?.user?.id ?? null
	const availableRoutes = getAvailableVerbRoutes()

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/icons/iconRunning.png"
						alt="Verbs"
						height={48}
						width={48}
					/>

					<h1 className="text-center font-cardo text-neutral-800 text-6xl my-6">
						פְּעָלִים
					</h1>
					<p className="text-center font-bold text-neutral-800 mb-2">Verbs</p>

					{!userId && (
						<p className="text-gray-500 italic mb-3">
							You’re using guest mode — progress will not be saved.
						</p>
					)}
				</div>

				<div className="space-y-4">
					<HebrewVerbList
						allVerbs={allVerbs}
						availableRoutes={availableRoutes}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}
