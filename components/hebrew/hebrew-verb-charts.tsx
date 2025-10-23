'use client'

import { useState, useEffect } from 'react'
import HebrewFutureVerbChart from './hebrew-verb-chart-future'
import HebrewImperativeVerbChart from './hebrew-verb-chart-imperative'
import HebrewInfinitiveVerbChart from './hebrew-verb-chart-infinitive'
import HebrewPastVerbChart from './hebrew-verb-chart-past'
import HebrewPresentVerbChart from './hebrew-verb-chart-present'
import HebrewVayyiqtolVerbChart from './hebrew-verb-chart-vayyiqtol'
import HebrewVerbPastCard from './hebrew-verb-card-past'

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
			</div>

			{/* Conditional Rendering */}
			{isMobile ? (
				// Render card layout for mobile
				<>
					{/* <div className="mb-12">
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
					</div> */}
					<div className="mb-12">
						<h3 className="text-2xl font-bold text-sky-800 mb-3 text-center">
							Past Tense (Perfect)
						</h3>
						<HebrewVerbPastCard
							title={'Past Tense (Perfect)'}
							data={pastData}
						/>
					</div>
					{/* <div className="mb-12">
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
					</div> */}
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
