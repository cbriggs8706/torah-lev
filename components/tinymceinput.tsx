'use client'

import * as React from 'react'
import { useInput, FieldTitle } from 'react-admin'

type Dir = 'rtl' | 'ltr' | 'auto'

type Props = {
	source: string
	label?: string
	dir?: Dir // default RTL for your Hebrew content
	minHeight?: number // editor height in px
}

export default function TinyMCEInput({
	source,
	label,
	dir,
	minHeight = 320,
}: Props) {
	const { field, fieldState, isRequired } = useInput({ source })

	// Uncontrolled: keep initial value stable to prevent caret jumps
	const initialHtmlRef = React.useRef<string>(field.value ?? '')
	const editorRef = React.useRef<any>(null)

	// Lazy-load TinyMCE editor at runtime (no next/dynamic typings issues)
	const [Editor, setEditor] = React.useState<any>(null)
	React.useEffect(() => {
		let mounted = true
		;(async () => {
			const mod = await import('@tinymce/tinymce-react')
			if (mounted) setEditor(() => mod.Editor)
		})()
		return () => {
			mounted = false
		}
	}, [])

	const directionality: 'rtl' | 'ltr' | undefined =
		dir === 'auto' ? undefined : dir

	const init = React.useMemo(
		() => ({
			height: minHeight,
			menubar: false,
			branding: false,
			plugins: 'link lists code directionality table',
			toolbar:
				'undo redo | blocks | bold italic underline | ' +
				'alignleft aligncenter alignright | bullist numlist | ' +
				'ltr rtl | link table | code',
			directionality, // RTL/LTR content
			convert_urls: false,
			remove_script_host: true,
			block_formats:
				'Paragraph=p; Heading 2=h2; Heading 3=h3; Heading 4=h4; Preformatted=pre',
		}),
		[directionality, minHeight]
	)

	const handleInit = React.useCallback((_evt: any, editor: any) => {
		editorRef.current = editor
	}, [])

	// Save to RA **on blur** (uncontrolled while typing = no cursor drift)
	const handleBlur = React.useCallback(() => {
		if (editorRef.current) {
			field.onChange(editorRef.current.getContent())
		}
	}, [field])

	return (
		<div className="ra-input" dir={dir === 'auto' ? undefined : dir}>
			{label && (
				<FieldTitle label={label} source={source} isRequired={isRequired} />
			)}

			{/* Render once the Editor is loaded on the client */}
			{Editor ? (
				<Editor
					apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
					onInit={handleInit}
					initialValue={initialHtmlRef.current} // uncontrolled
					init={init}
					onBlur={handleBlur}
					/* Intentionally omit `value` / `onEditorChange` to keep it uncontrolled */
				/>
			) : (
				<div>Loading editor…</div>
			)}

			{fieldState.error && (
				<div style={{ color: 'var(--ra-error-main)', marginTop: 4 }}>
					{fieldState.error.message}
				</div>
			)}
		</div>
	)
}
