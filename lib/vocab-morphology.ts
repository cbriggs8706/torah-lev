type RootMorphologySource = {
	rootPerson?: string | null
	rootGender?: string | null
	rootNumber?: string | null
}

function normalizeMorphologyValue(value?: string | null) {
	if (!value) return ''
	const normalized = value.trim()
	if (!normalized || normalized === '—' || normalized === '–') return ''
	return normalized
}

export function formatRootGenderDisplay(value?: string | null) {
	const normalized = normalizeMorphologyValue(value)
	if (normalized === 'e') return '⚥'
	if (normalized === 'c') return 'C'
	return normalized
}

export function getRootMorphologyParts(entry: RootMorphologySource) {
	return {
		rootPerson: normalizeMorphologyValue(entry.rootPerson),
		rootGender: normalizeMorphologyValue(entry.rootGender),
		rootNumber: normalizeMorphologyValue(entry.rootNumber),
	}
}

export function hasRootMorphology(entry: RootMorphologySource) {
	const { rootPerson, rootGender, rootNumber } = getRootMorphologyParts(entry)
	return !!(rootPerson || rootGender || rootNumber)
}

export function formatRootMorphology(entry: RootMorphologySource) {
	const { rootPerson, rootGender, rootNumber } = getRootMorphologyParts(entry)
	return [
		rootPerson,
		formatRootGenderDisplay(rootGender),
		rootNumber,
	]
		.filter(Boolean)
		.join('')
}
