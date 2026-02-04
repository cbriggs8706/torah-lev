import fs from 'fs'
import path from 'path'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { FeedWrapper } from '@/components/feed-wrapper'
import allVerbs from '@/lib/data/hebrew/verbs/index.json'
import HebrewVerbCharts from '@/components/hebrew/hebrew-verb-charts'

type Params = {
	params: Promise<{
		binyan: string
		id: string
	}>
}

export default async function HebrewVerbChartPage({ params }: Params) {
	const { binyan, id } = await params
	const strongs = Number(id)

	// ✅ Construct the binyan directory path
	const binyanDir = path.join(
		process.cwd(),
		'lib',
		'data',
		'hebrew',
		'verbs',
		binyan
	)

	// ✅ Expected conjugation files per binyan
	const files = [
		'past.json',
		'present.json',
		'future.json',
		'imperative.json',
		'infinitive.json',
		'vayyiqtol.json',
	]

	// ✅ Load and filter all conjugation data
	const conjugations: Record<string, any[]> = {}

	for (const file of files) {
		const filePath = path.join(binyanDir, file)
		if (!fs.existsSync(filePath)) continue // skip missing files

		const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
		conjugations[file.replace('.json', '')] = data.filter(
			(entry: any) => entry.strongs === strongs
		)
	}

	// ✅ Determine if any conjugations exist for this verb
	const hasData = Object.values(conjugations).some(
		(arr) => Array.isArray(arr) && arr.length > 0
	)
	console.log('hasData', hasData)
	if (!hasData) return notFound()

	// ✅ Find the base verb info from index.json
	const verb = allVerbs.find((v) => v.strongs === strongs)
	console.log('verb', verb)
	if (!verb) return notFound()

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/icons/iconStories.png"
						alt="Verb"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-cardo text-neutral-800 text-6xl my-6">
						פֹּעַל
					</h1>
					<p className="text-center font-bold text-neutral-800 mb-2">Verb</p>
				</div>

				{/* Pass data to your component */}
				<HebrewVerbCharts
					binyan={binyan}
					verb={verb}
					conjugations={conjugations}
				/>
			</FeedWrapper>
		</div>
	)
}
