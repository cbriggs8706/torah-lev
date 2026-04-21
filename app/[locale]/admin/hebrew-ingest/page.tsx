// app/[locale]/admin/hebrew-ingest/page.tsx
import { CustomHebrewIngestForm } from '@/components/custom/CustomHebrewIngestForm'
import { supabaseDb as db } from '@/db'
import { customHebrewBooks } from '@/db/schema/tables/custom_hebrew_books'

interface PageProps {
	params: Promise<{ locale: string }>
}

export default async function CustomIngestPage({ params }: PageProps) {
	await params
	const books = await db
		.select({
			id: customHebrewBooks.id,
			title: customHebrewBooks.title,
		})
		.from(customHebrewBooks)

	return (
		<div className="space-y-6">
			<div className="tl-panel rounded-[2rem] p-4 md:p-6">
				<CustomHebrewIngestForm customHebrewBooks={books} />
			</div>
		</div>
	)
}
