'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type ActivityFinalScreenStat = {
	label: string
	value: ReactNode
	valueClassName?: string
}

type ActivityFinalScreenProps = {
	title: string
	description?: ReactNode
	stats?: ActivityFinalScreenStat[]
	rewards?: ReactNode
	message?: ReactNode
	actions?: ReactNode
	reviewSection?: ReactNode
	celebration?: ReactNode
	prelude?: ReactNode
	className?: string
	cardClassName?: string
}

export function ActivityFinalScreen({
	title,
	description,
	stats = [],
	rewards,
	message,
	actions,
	reviewSection,
	celebration,
	prelude,
	className,
	cardClassName,
}: ActivityFinalScreenProps) {
	return (
		<div className={cn('mx-auto w-full max-w-4xl px-2 pb-8', className)}>
			{celebration}
			{prelude}

			<div
				className={cn(
					'rounded-[2rem] border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8',
					cardClassName,
				)}
			>
				<h2 className="text-3xl font-bold text-slate-900">{title}</h2>

				{description ? (
					<p className="mt-3 text-slate-600">{description}</p>
				) : null}

				{stats.length > 0 ? (
					<div className="mt-6 grid gap-4 sm:grid-cols-3">
						{stats.map((stat) => (
							<div
								key={stat.label}
								className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
							>
								<p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
									{stat.label}
								</p>
								<p
									className={cn(
										'mt-2 text-4xl font-bold text-slate-900',
										stat.valueClassName,
									)}
								>
									{stat.value}
								</p>
							</div>
						))}
					</div>
				) : null}

				{rewards ? <div className="mt-6">{rewards}</div> : null}
				{message ? <div className="mt-6">{message}</div> : null}
				{actions ? <div className="mt-8">{actions}</div> : null}
				{reviewSection ? <div className="mt-10">{reviewSection}</div> : null}
			</div>
		</div>
	)
}
