import Image from 'next/image'
import Link from 'next/link'

import { cn } from '@/lib/utils'

type CatalogCardProps = {
	href: string
	eyebrow?: string | null
	title: string
	imageUrl: string
	kindLabel: string
	subtitle: string
	proficiencyLevel?: string | null
	endingProficiencyLevel?: string | null
	ctaLabel?: string
	priority?: boolean
	progress?: {
		completed: number
		total: number
	} | null
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
	eyebrow,
	title,
	imageUrl,
	kindLabel,
	subtitle,
	proficiencyLevel,
	endingProficiencyLevel,
	ctaLabel = 'Begin this course',
	priority = false,
	progress = null,
}: CatalogCardProps) {
	const hasProgress = Boolean(progress)
	const isCompleted =
		Boolean(progress) && (progress.total === 0 || progress.completed >= progress.total)
	const progressPercent = progress
		? progress.total === 0
			? 100
			: Math.min(100, Math.round((progress.completed / progress.total) * 100))
		: 0

	return (
		<Link
			href={href}
			prefetch={false}
			className={cn(
				'group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md',
				isCompleted
					? 'border-emerald-300 bg-gradient-to-b from-emerald-50 via-white to-emerald-100/70 shadow-[0_18px_40px_-28px_rgba(16,185,129,0.55)]'
					: 'border-slate-200',
			)}
		>
			<div className="relative h-48 w-full overflow-hidden bg-slate-100">
				<Image
					src={imageUrl}
					alt={title}
					fill
					sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
					className="object-cover transition duration-300 group-hover:scale-[1.03]"
					loading={priority ? 'eager' : undefined}
					fetchPriority={priority ? 'high' : undefined}
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
					{eyebrow ? (
						<h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
							{eyebrow}
						</h2>
					) : null}
					<h3 className="mt-1 text-base font-semibold text-slate-900">{title}</h3>
					<p className="mt-2 text-sm text-slate-600">{subtitle}</p>
				</div>
				{hasProgress ? (
					<div className="mt-4 space-y-2">
						<div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.18em]">
							<span
								className={cn(
									isCompleted ? 'text-emerald-700' : 'text-slate-500',
								)}
							>
								{isCompleted ? 'Completed' : 'Progress'}
							</span>
							<span
								className={cn(
									'tracking-normal',
									isCompleted ? 'text-emerald-700' : 'text-slate-600',
								)}
							>
								{progressPercent}%
							</span>
						</div>
						<div
							className={cn(
								'h-2 overflow-hidden rounded-full',
								isCompleted ? 'bg-emerald-100' : 'bg-slate-200',
							)}
						>
							<div
								className={cn(
									'h-full rounded-full transition-all duration-300',
									isCompleted ? 'bg-emerald-600' : 'bg-sky-600',
								)}
								style={{ width: `${progressPercent}%` }}
							/>
						</div>
						<p
							className={cn(
								'text-sm font-semibold',
								isCompleted ? 'text-emerald-700' : 'text-slate-600',
							)}
						>
							{isCompleted
								? 'Course completed'
								: `${progress.completed} of ${progress.total} activities completed`}
						</p>
					</div>
				) : (
					<div className="mt-4">
						<span className="inline-flex items-center justify-center rounded-full border border-rose-950 bg-rose-800 px-4 py-2 text-sm font-semibold text-white shadow-sm transition group-hover:bg-rose-700 group-hover:shadow-md">
							{ctaLabel}
						</span>
					</div>
				)}
			</div>
		</Link>
	)
}
