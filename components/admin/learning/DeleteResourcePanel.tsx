'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface Props {
	apiPath: string
	backHref: string
	resourceLabel: string
	resourceTitle: string
}

export function DeleteResourcePanel({
	apiPath,
	backHref,
	resourceLabel,
	resourceTitle,
}: Props) {
	const router = useRouter()
	const [deleting, setDeleting] = useState(false)
	const [error, setError] = useState<string | null>(null)

	async function confirmDelete() {
		setDeleting(true)
		setError(null)

		try {
			const res = await fetch(apiPath, { method: 'DELETE' })
			if (!res.ok) {
				const body = await res.json().catch(() => null)
				throw new Error(body?.error || `Unable to delete ${resourceLabel}`)
			}

			router.push(backHref)
			router.refresh()
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Delete failed')
			setDeleting(false)
		}
	}

	return (
		<div className="max-w-2xl rounded-3xl border border-destructive/30 bg-destructive/5 p-6">
			<p className="text-sm uppercase tracking-[0.28em] text-destructive">
				Confirm Delete
			</p>
			<h1 className="mt-2 font-[family:var(--font-eczar)] text-4xl">
				Delete {resourceLabel}
			</h1>
			<p className="mt-3 text-sm text-muted-foreground">
				Are you sure you want to delete “{resourceTitle}”? This action cannot
				be undone.
			</p>
			{error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
			<div className="mt-6 flex gap-3">
				<Button
					type="button"
					variant="outline"
					onClick={() => router.push(backHref)}
				>
					Cancel
				</Button>
				<Button
					type="button"
					variant="destructive"
					onClick={confirmDelete}
					disabled={deleting}
				>
					{deleting ? 'Deleting...' : `Delete ${resourceLabel}`}
				</Button>
			</div>
		</div>
	)
}
