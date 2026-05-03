'use client'

import {
	AutocompleteInput,
	ReferenceInput,
	required,
	SimpleForm,
	TextInput,
} from 'react-admin'

const longTextSx = { width: '100%' }

export function ConstructAbsoluteWordForm() {
	return (
		<SimpleForm>
			<ReferenceInput
				source="lessonId"
				reference="lessons"
				perPage={200}
				sort={{ field: 'lessonSort', order: 'ASC' }}
			>
				<AutocompleteInput
					label="Lesson"
					optionText="lessonLabel"
					optionValue="id"
					fullWidth
					validate={[required()]}
				/>
			</ReferenceInput>
			<TextInput
				source="absolute"
				label="Absolute Form"
				validate={[required()]}
				sx={longTextSx}
			/>
			<TextInput
				source="construct"
				label="Construct Form"
				validate={[required()]}
				sx={longTextSx}
			/>
		</SimpleForm>
	)
}
