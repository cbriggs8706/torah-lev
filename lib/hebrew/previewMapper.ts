// lib/hebrew/previewMapper.ts
import { segmentHebrewWordHybrid } from './segmentHebrewWordHybrid'
import { searchSurface } from './searchSurface'

/** Main preview function */
export async function previewSegments(surface: string) {
	const segments = segmentHebrewWordHybrid(surface)

	const result = []

	for (const seg of segments) {
		const matches = await searchSurface(seg)

		result.push({
			segment: seg,
			existing: matches.length > 0,
			candidates: matches,
		})
	}

	return result
}
