export function splitCategoryValues(category?: string | null): string[] {
	if (!category) return []

	return category
		.split(',')
		.map((value) => value.trim())
		.filter(Boolean)
}

export function matchesSelectedCategory(
	category: string | null | undefined,
	selectedCategory: string
): boolean {
	if (selectedCategory === 'all') return true

	return splitCategoryValues(category).includes(selectedCategory)
}
