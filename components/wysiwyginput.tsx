'use client'

import dynamic from 'next/dynamic'
import * as React from 'react'
import { useInput, FieldTitle } from 'react-admin'

// Jodit needs window -> disable SSR
const JoditEditor = dynamic(() => import('jodit-react'), { ssr: false })

type Dir = 'rtl' | 'ltr' | 'auto'

type Props = {
	source: string
	label?: string
	dir?: Dir // default 'rtl' for your stories
	minHeight?: number
}

function WysiwygInput({ source, label, dir = 'rtl', minHeight = 260 }: Props) {
	const { field, fieldState, isRequired } = useInput({ source })

	// Freeze initial HTML so Jodit stays stable while typing (prevents caret jumps)
	const initialHtmlRef = React.useRef<string>(field.value ?? '')

	// Jodit typings only allow '' | 'rtl' | 'ltr'
	const joditDirection: '' | 'rtl' | 'ltr' = dir === 'auto' ? '' : dir

	const config = React.useMemo(
		() =>
			({
				readonly: false,
				direction: joditDirection, // RTL/LTR handled by Jodit itself
				toolbarAdaptive: false,
				spellcheck: false,
				height: minHeight, // number is fine
				buttons: [
					'bold',
					'italic',
					'underline',
					'|',
					'ul',
					'ol',
					'|',
					'link',
					'|',
					'left',
					'center',
					'right',
					'|',
					'eraser',
					'brush',
					'|',
					'table',
					'image',
					'|',
					'source', // <-- HTML source toggle
				],
				// keep toolbar simple & stable to avoid re-inits
				toolbarSticky: false,
				saveSelectionOnBlur: true,
			} as any),
		[joditDirection, minHeight]
	)

	// Save back to RA **on blur** so we don't re-render on every keystroke
	const handleBlur = React.useCallback(
		(html: string) => {
			field.onChange(html)
		},
		[field]
	)

	return (
		<div className="ra-input" dir={dir === 'auto' ? undefined : dir}>
			{label && (
				<FieldTitle label={label} source={source} isRequired={isRequired} />
			)}
			<JoditEditor
				// IMPORTANT: pass a stable value; don't update while typing
				value={initialHtmlRef.current}
				config={config}
				onBlur={handleBlur}
				onChange={() => {
					/* ignore live changes to prevent rerenders */
				}}
			/>
			{fieldState.error && (
				<div style={{ color: 'var(--ra-error-main)', marginTop: 4 }}>
					{fieldState.error.message}
				</div>
			)}
		</div>
	)
}

export default React.memo(WysiwygInput)
