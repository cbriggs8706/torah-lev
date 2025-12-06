// app/[locale]/admin/lexemes/[id]/page.tsx
import LexemeEditor from '@/components/admin/lexemes/LexemeEditor'
import { getLexemeById } from '@/db/queries/lexemes'
interface PageProps {
	params: Promise<{ id: string }>
}
export default async function LexemeEditPage({ params }: PageProps) {
	const { id } = await params

	const lexeme = await getLexemeById(id)

	if (!lexeme) {
		return <div className="p-6 text-red-600 text-xl">Lexeme not found.</div>
	}

	return (
		<div className="max-w-4xl mx-auto p-6">
			<h1 className="text-3xl font-bold mb-6">
				Edit Lexeme: <span className="font-mono">{lexeme.lemma}</span>
			</h1>

			<LexemeEditor initial={lexeme} />
		</div>
	)
}
