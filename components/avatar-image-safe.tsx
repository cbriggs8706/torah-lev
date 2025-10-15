'use client'
import Image from 'next/image'

export function AvatarImageSafe({
	src,
	alt,
	size = 48,
}: {
	src?: string
	alt?: string
	size?: number
}) {
	const clean = src?.replace(/\s|\n|\r/g, '').trim() || '/mascot.svg'
	return (
		<Image
			src={clean}
			alt={alt || 'User Avatar'}
			width={size}
			height={size}
			className="rounded-full border object-cover"
			unoptimized
			onError={(e) => ((e.target as HTMLImageElement).src = '/mascot.svg')}
		/>
	)
}
