// components/lessons/HebrewVocabInlineEditor.tsx

'use client'

import { HebrewVocabFormValues } from '@/forms/hebrewVocabSchemas'
import { HebrewVocabForm } from './HebrewVocabForm'

export function HebrewVocabInlineEditor({
	onSaved,
}: {
	onSaved?: (vocab?: HebrewVocabFormValues & { id: string }) => void
}) {
	return <HebrewVocabForm mode="create" onSaved={onSaved} />
}
