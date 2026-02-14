// app/[locale]/admin/hebrew-ingest/page.tsx
import { CustomHebrewIngestForm } from '@/components/custom/CustomHebrewIngestForm'
import { supabaseDb as db } from '@/db'
import { customHebrewBooks } from '@/db/schema/tables/custom_hebrew_books'

export default async function CustomIngestPage() {
	const books = await db
		.select({
			id: customHebrewBooks.id,
			title: customHebrewBooks.title,
		})
		.from(customHebrewBooks)

	return (
		<div className="px-4 py-6">
			<CustomHebrewIngestForm customHebrewBooks={books} />
		</div>
	)
}
