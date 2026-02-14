'use client'

import { Editor } from '@tinymce/tinymce-react'

type RichTextEditorProps = {
	value: string
	onChange: (next: string) => void
	disabled?: boolean
	height?: number
}

export function RichTextEditor({
	value,
	onChange,
	disabled = false,
	height = 360,
}: RichTextEditorProps) {
	return (
		<Editor
			apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
			value={value}
			disabled={disabled}
			onEditorChange={onChange}
			init={{
				height,
				menubar: false,
				plugins: 'lists link image table code help wordcount',
				toolbar:
					'undo redo | bold italic underline | bullist numlist | link image table | code | removeformat',
				content_style:
					'body { font-family: ui-sans-serif, system-ui, sans-serif; font-size: 14px; }',
				branding: false,
			}}
		/>
	)
}
