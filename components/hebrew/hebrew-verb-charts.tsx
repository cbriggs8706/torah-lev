'use client'

import { useState, useEffect } from 'react'
import HebrewFutureVerbChart from './hebrew-verb-chart-future'
import HebrewImperativeVerbChart from './hebrew-verb-chart-imperative'
import HebrewInfinitiveVerbChart from './hebrew-verb-chart-infinitive'
import HebrewPastVerbChart from './hebrew-verb-chart-past'
import HebrewPresentVerbChart from './hebrew-verb-chart-present'
import HebrewVayyiqtolVerbChart from './hebrew-verb-chart-vayyiqtol'
import HebrewVerbPastCard from './hebrew-verb-card-past'
import HebrewVerbVayyiqtolCard from './hebrew-verb-card-vayyiqtol'
import HebrewVerbFutureCard from './hebrew-verb-card-future'
import HebrewVerbPresentCard from './hebrew-verb-card-present'
import HebrewVerbImperativeCard from './hebrew-verb-card-imperative'
import HebrewVerbInfinitiveCard from './hebrew-verb-card-infinitive'
import { Button } from '../ui/button'
import { useRouter } from 'next/navigation'

type HebrewVerbChartsProps = {
	binyan: string
	verb: {
		verb: string
		engTransliteration: string
		engTranslation: string
		strongs: number
	}
	conjugations: {
		past?: any[]
		present?: any[]
		future?: any[]
		imperative?: any[]
		infinitive?: any[]
		vayyiqtol?: any[]
	}
}

export default function HebrewVerbCharts({
	binyan,
	verb,
	conjugations,
}: HebrewVerbChartsProps) {
	const [isMobile, setIsMobile] = useState(false)
	const router = useRouter()

	// Detect screen width changes
	useEffect(() => {
		const handleResize = () => {
			setIsMobile(window.innerWidth < 640) // Change breakpoint as needed
		}
		handleResize() // Set initial state
		window.addEventListener('resize', handleResize)
		return () => window.removeEventListener('resize', handleResize)
	}, [])

	const pastData =
		conjugations.past && conjugations.past.length > 0
			? conjugations.past[0]
			: null
	const vayyiqtolData =
		conjugations.vayyiqtol && conjugations.vayyiqtol.length > 0
			? conjugations.vayyiqtol[0]
			: null

	const futureData =
		conjugations.future && conjugations.future.length > 0
			? conjugations.future[0]
			: null
	const imperativeData =
		conjugations.imperative && conjugations.imperative.length > 0
			? conjugations.imperative[0]
			: null
	const presentData =
		conjugations.present && conjugations.present.length > 0
			? conjugations.present[0]
			: null
	const infinitiveData =
		conjugations.infinitive && conjugations.infinitive.length > 0
			? conjugations.infinitive[0]
			: null

	console.log('imperativeData', imperativeData)

	return (
		<div className="mt-6 w-full">
			{/* Header Section */}
			<div className="text-center mb-6">
				<h2 className="text-8xl font-serif text-neutral-800">{verb.verb}</h2>
				<p className="italic text-gray-600">{verb.engTransliteration}</p>
				<p className="text-gray-700 font-nunito">{verb.engTranslation}</p>
				<p className="mt-2 text-sm text-gray-500">
					Binyan: <span className="font-semibold">{binyan}</span> • Strong’s:{' '}
					{verb.strongs}
				</p>
			</div>{' '}
			<div className="text-center mb-6">
				<Button
					variant={'default'}
					onClick={() => {
						router.push('/he/verbs')
						router.refresh() // revalidate the next route after the push
					}}
				>
					Back to Verb List
				</Button>
			</div>
			{/* Conditional Rendering */}
			{isMobile ? (
				// Render card layout for mobile
				<>
					<div className="mb-12">
						<h3 className="text-2xl font-bold text-sky-800 mb-3 text-center">
							Infinitive
						</h3>
						<HebrewVerbInfinitiveCard
							title={'Infinitive'}
							data={infinitiveData}
						/>
					</div>
					<div className="mb-12">
						<h3 className="text-2xl font-bold text-sky-800 mb-3 text-center">
							Vayyiqtol
						</h3>
						<HebrewVerbVayyiqtolCard title={'Vayyiqtol'} data={vayyiqtolData} />
					</div>
					<div className="mb-12">
						<h3 className="text-2xl font-bold text-sky-800 mb-3 text-center">
							Past Tense (Perfect)
						</h3>
						<HebrewVerbPastCard
							title={'Past Tense (Perfect)'}
							data={pastData}
						/>
					</div>
					<div className="mb-12">
						<h3 className="text-2xl font-bold text-sky-800 mb-3 text-center">
							Present Tense
						</h3>
						<HebrewVerbPresentCard title={'Present Tense'} data={presentData} />
					</div>
					<div className="mb-12">
						<h3 className="text-2xl font-bold text-sky-800 mb-3 text-center">
							Future Tense (Imperfect)
						</h3>
						<HebrewVerbFutureCard
							title={'Future Tense (Imperfect)'}
							data={futureData}
						/>
					</div>
					<div className="mb-12">
						<h3 className="text-2xl font-bold text-sky-800 mb-3 text-center">
							Imperative Tense
						</h3>
						<HebrewVerbImperativeCard
							title={'Imperative Tense'}
							data={imperativeData}
						/>
					</div>
				</>
			) : (
				// Render table layout for desktop
				<>
					<div className="mb-12">
						<h3 className="text-2xl font-bold text-sky-800 mb-3 text-center">
							Infinitive
						</h3>
						<HebrewInfinitiveVerbChart data={infinitiveData} />
					</div>
					<div className="mb-12">
						<h3 className="text-2xl font-bold text-sky-800 mb-3 text-center">
							Vayyiqtol (Perfect)
						</h3>
						<HebrewVayyiqtolVerbChart data={vayyiqtolData} />
					</div>
					<div className="mb-12">
						<h3 className="text-2xl font-bold text-sky-800 mb-3 text-center">
							Past Tense (Perfect)
						</h3>
						<HebrewPastVerbChart data={pastData} />
					</div>
					<div className="mb-12">
						<h3 className="text-2xl font-bold text-sky-800 mb-3 text-center">
							Present Tense
						</h3>
						<HebrewPresentVerbChart data={presentData} />
					</div>
					<div className="mb-12">
						<h3 className="text-2xl font-bold text-sky-800 mb-3 text-center">
							Future Tense (Imperfect)
						</h3>
						<HebrewFutureVerbChart data={futureData} />
					</div>
					<div className="mb-12">
						<h3 className="text-2xl font-bold text-sky-800 mb-3 text-center">
							Imperative
						</h3>
						<HebrewImperativeVerbChart data={imperativeData} />
					</div>
				</>
			)}
		</div>
	)
}
