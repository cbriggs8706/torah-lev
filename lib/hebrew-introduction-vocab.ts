import type { HebrewVocab } from '@/lib/vocab'

export function isIntroductionReadyHebrewVocab(card: HebrewVocab) {
	const hasSupportedType = card.type === 'word' || card.type === 'phrase'
	const hasImage = card.images.some((image) => image.trim().length > 0)
	const hasHebrewAudio = card.hebAudio.trim().length > 0

	return hasSupportedType && hasImage && hasHebrewAudio
}
