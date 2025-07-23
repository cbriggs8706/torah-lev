import { SimpleForm, Edit, TextInput, required } from 'react-admin'

export const LessonScriptEdit = () => {
	return (
		<Edit>
			<SimpleForm>
				<TextInput
					source="lessonId"
					validate={[required()]}
					label="Lesson ID"
				/>
				<TextInput source="content" label="content" />
				<TextInput source="contentPlain" label="contentPlain" />
			</SimpleForm>
		</Edit>
	)
}
