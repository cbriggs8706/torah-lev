// components/media/audio-utils.ts
export function isSpotifyUrl(input?: string | null) {
	if (!input) return false
	if (input.startsWith('spotify:')) return true
	try {
		const u = new URL(input)
		return /(^|\.)spotify\.com$/i.test(u.hostname)
	} catch {
		return false
	}
}

export function formatTime(t: number) {
	if (!isFinite(t) || t < 0) return '0:00'
	const m = Math.floor(t / 60)
	const s = Math.floor(t % 60)
	return `${m}:${s.toString().padStart(2, '0')}`
}
