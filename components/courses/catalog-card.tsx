import Image from 'next/image'
import Link from 'next/link'

import { cn } from '@/lib/utils'

type CatalogCardProps = {
	href: string
	title: string
	imageUrl: string
	kindLabel: string
	subtitle: string
	proficiencyLevel?: string | null
	endingProficiencyLevel?: string | null
}

const levelColors: Record<string, string> = {
	Pre: 'bg-red-600',
	A1: 'bg-orange-600',
	A2: 'bg-yellow-600',
	B1: 'bg-green-600',
	B2: 'bg-sky-600',
	C1: 'bg-indigo-600',
	C2: 'bg-violet-600',
}

export default function CatalogCard({
	href,
	title,
	imageUrl,
	kindLabel,
	subtitle,
	proficiencyLevel,
	endingProficiencyLevel,
}: CatalogCardProps) {
	return (
		<Link
			href={href}
			className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
		>
			<div className="relative h-48 w-full overflow-hidden bg-slate-100">
				<Image
					src={imageUrl}
					alt={title}
					fill
					sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
					className="object-cover transition duration-300 group-hover:scale-[1.03]"
				/>
				<div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
					{kindLabel}
				</div>
				{proficiencyLevel || endingProficiencyLevel ? (
					<div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-800">
						{proficiencyLevel ? (
							<span
								className={cn(
									'inline-flex h-6 w-6 items-center justify-center rounded-full text-white',
									levelColors[proficiencyLevel] ?? 'bg-slate-600'
								)}
							>
								{proficiencyLevel}
							</span>
						) : null}
						{proficiencyLevel && endingProficiencyLevel ? <span>to</span> : null}
						{endingProficiencyLevel ? (
							<span
								className={cn(
									'inline-flex h-6 w-6 items-center justify-center rounded-full text-white',
									levelColors[endingProficiencyLevel] ?? 'bg-slate-600'
								)}
							>
								{endingProficiencyLevel}
							</span>
						) : null}
					</div>
				) : null}
			</div>
			<div className="flex flex-1 flex-col justify-between p-4">
				<div>
					<h2 className="text-lg font-semibold text-slate-900">{title}</h2>
					<p className="mt-2 text-sm text-slate-600">{subtitle}</p>
				</div>
				<p className="mt-4 text-sm font-semibold text-sky-700">Open course</p>
			</div>
		</Link>
	)
}

